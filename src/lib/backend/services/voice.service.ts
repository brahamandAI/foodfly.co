import OpenAI from 'openai';
import { User } from '../models/user.model';
import Order from '../models/order.model';
import { Restaurant } from '../models/restaurant.model';
import { MenuItem } from '../models/menuItem.model';
import { HealthProfile } from '../models/healthProfile.model';
import { Cart } from '../models/cart.model';
import { VoiceSession } from '../models/voiceSession.model';

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

const initializeOpenAI = (): OpenAI => {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai!;
};

const isOpenAIAvailable = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};

export interface VoiceConversationState {
  userId: string;
  sessionId: string;
  context: any;
  step: 'initial' | 'restaurant_selection' | 'menu_browsing' | 'quantity_selection' | 'confirmation' | 'complete';
  pendingOrder?: {
    restaurantId?: string;
    items?: Array<{
      menuItemId: string;
      quantity: number;
      customization?: string;
    }>;
    deliveryAddress?: any;
  };
  lastIntent?: string;
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  healthProfile?: any;
}

export interface VoiceProcessingResult {
  response: string;
  audioResponse?: Buffer;
  actions?: any[];
  shouldContinue: boolean;
  healthRecommendations?: any;
  sessionState?: any;
}

export interface VoiceSessionData {
  sessionId: string;
  conversationData?: any;
  orderDetails?: any;
  timestamp: Date;
}

// In-memory conversation states for quick access (supplement to database)
const quickStateCache = new Map<string, VoiceConversationState>();

export class VoiceService {
  // Convert audio buffer to text using OpenAI Whisper
  async speechToText(audioBuffer: Buffer, filename: string): Promise<string> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. Voice features are not available.');
    }
    
    try {
      const client = initializeOpenAI();
      const transcription = await client.audio.transcriptions.create({
        file: new File([audioBuffer], filename, { type: 'audio/webm' }),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });

      return transcription;
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  // Convert text to speech using OpenAI TTS
  async textToSpeech(text: string, voice: string = 'alloy', speed: number = 1.0): Promise<Buffer> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. Voice features are not available.');
    }
    
    try {
      const client = initializeOpenAI();
      const mp3 = await client.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: text,
        speed: speed,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  // Process voice command using conversational AI with health awareness
  async processVoiceCommand(
    userId: string,
    sessionId: string,
    userMessage: string,
    healthProfile?: any
  ): Promise<VoiceProcessingResult> {
    try {
      // Try to get session from database first
      let dbSession = await VoiceSession.findActiveSession(sessionId);
      
      // If not found, create a new session
      if (!dbSession) {
        dbSession = await VoiceSession.createSession(
          userId, 
          sessionId, 
          healthProfile?._id?.toString()
        );
      }

      // Get or create in-memory state for quick processing
      let state = quickStateCache.get(sessionId) || {
        userId,
        sessionId,
        context: dbSession.context || {},
        step: dbSession.step,
        conversation: dbSession.conversation.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        pendingOrder: dbSession.pendingOrder,
        lastIntent: dbSession.lastIntent,
        healthProfile,
      };

      // Update health profile in state
      if (healthProfile) {
        state.healthProfile = healthProfile;
      }

      // Add user message to conversation
      state.conversation.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Get user context
      const user = await User.findById(userId);
      const userOrders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('restaurant items.menuItem');

      // Create system prompt with context
      const systemPrompt = this.createSystemPrompt(user, userOrders, state);
      
      // Check if OpenAI is available
      if (!isOpenAIAvailable()) {
        throw new Error('OpenAI API key not configured. Voice command processing is not available.');
      }

      // Get AI response
      const client = initializeOpenAI();
      const completion = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...state.conversation.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
        ],
        functions: [
          {
            name: 'search_restaurants',
            description: 'Search for restaurants based on criteria',
            parameters: {
              type: 'object',
              properties: {
                cuisine: { type: 'string' },
                location: { type: 'string' },
                priceRange: { type: 'string' },
                healthyOnly: { type: 'boolean' },
              },
            },
          },
          {
            name: 'search_menu_items',
            description: 'Search for menu items with health filtering',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: { type: 'string' },
                query: { type: 'string' },
                category: { type: 'string' },
                healthFilters: { type: 'object' },
              },
            },
          },
          {
            name: 'add_to_cart',
            description: 'Add items to user cart with health validation',
            parameters: {
              type: 'object',
              properties: {
                restaurantId: { type: 'string' },
                menuItemId: { type: 'string' },
                quantity: { type: 'number' },
                customization: { type: 'string' },
              },
            },
          },
          {
            name: 'get_health_recommendations',
            description: 'Get personalized health recommendations',
            parameters: {
              type: 'object',
              properties: {
                mealType: { type: 'string' },
                calorieGoal: { type: 'number' },
              },
            },
          },
          {
            name: 'reorder_previous',
            description: 'Reorder from previous order with health validation',
            parameters: {
              type: 'object',
              properties: {
                orderId: { type: 'string' },
              },
            },
          },
          {
            name: 'place_order',
            description: 'Place the final order',
            parameters: {
              type: 'object',
              properties: {
                paymentMethod: { type: 'string' },
                deliveryAddress: { type: 'object' },
              },
            },
          },
        ],
        function_call: 'auto',
      });

      const message = completion.choices[0].message;
      let response = message.content || 'I understand. How can I help you with your order?';
      let actions: any[] = [];
      let shouldContinue = true;
      let healthRecommendations = null;

      // Handle function calls
      if (message.function_call) {
        const functionResult = await this.handleFunctionCall(
          message.function_call,
          userId,
          state
        );
        
        response = functionResult.response;
        actions = functionResult.actions;
        state = functionResult.updatedState;
        healthRecommendations = functionResult.healthRecommendations;
      }

      // Add assistant response to conversation
      state.conversation.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });

      // Update cache
      quickStateCache.set(sessionId, state);

      // Save to database
      await dbSession.addMessage('user', userMessage);
      await dbSession.addMessage('assistant', response, healthRecommendations, actions);
      
      // Update session state
      if (state.step !== dbSession.step) {
        await dbSession.updateStep(state.step);
      }
      
      if (state.pendingOrder) {
        await dbSession.updatePendingOrder(state.pendingOrder);
      }

      // Mark session as complete if needed
      if (state.step === 'complete') {
        await dbSession.markComplete();
        shouldContinue = false;
        // Remove from cache after completion
        setTimeout(() => {
          quickStateCache.delete(sessionId);
        }, 5 * 60 * 1000); // 5 minutes
      }

      return {
        response,
        actions,
        shouldContinue,
        healthRecommendations,
        sessionState: {
          step: state.step,
          pendingOrder: state.pendingOrder,
          lastIntent: state.lastIntent,
        },
      };
    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Failed to process voice command');
    }
  }

  private createSystemPrompt(user: any, recentOrders: any[], state: VoiceConversationState): string {
    const healthInfo = state.healthProfile ? `
User Health Profile:
- Dietary Preferences: ${state.healthProfile.dietaryPreferences?.join(', ') || 'None specified'}
- Allergies: ${state.healthProfile.allergies?.map((a: any) => `${a.allergen} (${a.severity})`).join(', ') || 'None'}
- Fitness Goals: ${state.healthProfile.fitnessGoals?.join(', ') || 'None specified'}
- Daily Calorie Goal: ${state.healthProfile.dailyCalorieGoal || 'Not set'} calories
- Health Score: ${state.healthProfile.healthScore || 'Not calculated'}/100
- Health Conditions: ${state.healthProfile.healthConditions?.join(', ') || 'None'}
- Activity Level: ${state.healthProfile.activityLevel || 'Not specified'}
` : '';

    const recentOrdersInfo = recentOrders.length > 0 ? `
Recent Orders:
${recentOrders.map(order => 
  `- ${order.restaurant?.name}: ${order.items?.map((item: any) => item.menuItem?.name).join(', ')}`
).join('\n')}
` : '';

    return `You are FoodFly's AI voice assistant. Help users order food through natural conversation.

${healthInfo}

${recentOrdersInfo}

Current conversation step: ${state.step}
Pending order: ${JSON.stringify(state.pendingOrder, null, 2)}

Guidelines:
1. Be conversational and friendly
2. Always consider the user's health profile when making suggestions
3. Warn about allergens and dietary restrictions
4. Suggest healthier alternatives when appropriate
5. Track calories and nutritional information
6. Guide users through the ordering process step by step
7. Ask clarifying questions when needed
8. Use function calls to search restaurants, menu items, and manage orders
9. Provide health insights and recommendations
10. Keep responses concise but informative

If the user has health restrictions, prioritize their safety and health goals.`;
  }

  private async handleFunctionCall(
    functionCall: any,
    userId: string,
    state: VoiceConversationState
  ): Promise<{
    response: string;
    actions: any[];
    updatedState: VoiceConversationState;
    healthRecommendations?: any;
  }> {
    const { name, arguments: args } = functionCall;
    const parsedArgs = JSON.parse(args);
    let response = '';
    let actions: any[] = [];
    let healthRecommendations = null;

    try {
      switch (name) {
        case 'search_restaurants':
          const restaurants = await this.searchRestaurants(parsedArgs, state.healthProfile);
          response = `I found ${restaurants.length} restaurants that match your criteria. ${restaurants.map(r => r.name).join(', ')}. Which one interests you?`;
          actions.push({ type: 'show_restaurants', data: restaurants });
          state.step = 'restaurant_selection';
          break;

        case 'search_menu_items':
          const menuItems = await this.searchMenuItems(parsedArgs, state.healthProfile);
          const healthyItems = menuItems.filter(item => this.isHealthyForUser(item, state.healthProfile));
          
          if (healthyItems.length > 0) {
            response = `I found ${healthyItems.length} items that match your preferences and health profile. ${healthyItems.map(item => `${item.name} (${item.nutritionalInfo?.calories || 'N/A'} cal)`).join(', ')}. What would you like to add?`;
            healthRecommendations = {
              recommended: healthyItems.slice(0, 3),
              alternatives: menuItems.filter(item => !this.isHealthyForUser(item, state.healthProfile)).slice(0, 2),
            };
          } else {
            response = `I found ${menuItems.length} items, but none fully match your health profile. Would you like to see alternatives or modify your preferences?`;
          }
          
          actions.push({ type: 'show_menu_items', data: menuItems });
          state.step = 'menu_browsing';
          break;

        case 'add_to_cart':
          await this.addToCart(userId, parsedArgs);
          const item = await MenuItem.findById(parsedArgs.menuItemId);
          
          if (item && state.healthProfile) {
            const healthWarnings = this.getHealthWarnings(item, state.healthProfile);
            const healthyNote = healthWarnings.length > 0 
              ? ` Note: ${healthWarnings.join(', ')}.`
              : ' Great choice for your health goals!';
            
            response = `Added ${parsedArgs.quantity} ${item.name} to your cart.${healthyNote} Anything else?`;
          } else {
            response = `Added ${parsedArgs.quantity} item(s) to your cart. What else can I get you?`;
          }
          
          actions.push({ type: 'update_cart', data: parsedArgs });
          state.step = 'quantity_selection';
          break;

        case 'get_health_recommendations':
          healthRecommendations = await this.getHealthAwareSuggestions(
            userId,
            state.healthProfile,
            parsedArgs
          );
          response = `Based on your health profile, I recommend: ${healthRecommendations.map((r: any) => r.name).join(', ')}. These options align with your dietary preferences and fitness goals.`;
          actions.push({ type: 'show_health_recommendations', data: healthRecommendations });
          break;

        case 'reorder_previous':
          await this.reorderPrevious(userId, parsedArgs.orderId);
          response = 'I\'ve reordered your previous items. Let me check if they still align with your current health goals...';
          actions.push({ type: 'reorder', data: parsedArgs });
          state.step = 'confirmation';
          break;

        case 'place_order':
          const order = await this.placeOrder(userId, parsedArgs);
          response = 'Perfect! Your order has been placed. You\'ll receive a confirmation shortly.';
          actions.push({ type: 'order_placed', data: order });
          state.step = 'complete';
          break;

        default:
          response = 'I\'m not sure how to help with that. Can you please rephrase?';
      }
    } catch (error) {
      console.error(`Function call error (${name}):`, error);
      response = 'I encountered an issue processing that request. Please try again.';
    }

    return {
      response,
      actions,
      updatedState: state,
      healthRecommendations,
    };
  }

  private async searchRestaurants(criteria: any, healthProfile?: any): Promise<any[]> {
    try {
      const query: any = {};
      
      if (criteria.cuisine) {
        query.cuisine = new RegExp(criteria.cuisine, 'i');
      }
      
      if (criteria.location) {
        query.location = new RegExp(criteria.location, 'i');
      }

      let restaurants = await Restaurant.find(query).limit(10);

      // Filter for healthy options if health profile exists
      if (healthProfile && criteria.healthyOnly) {
        restaurants = restaurants.filter(restaurant => {
          // Since healthyOptions and healthRating might not exist, use basic filtering
          return restaurant.rating >= 4 || restaurant.name.toLowerCase().includes('healthy');
        });
      }

      return restaurants;
    } catch (error) {
      console.error('Restaurant search error:', error);
      return [];
    }
  }

  private async searchMenuItems(criteria: any, healthProfile?: any): Promise<any[]> {
    try {
      const query: any = {};
      
      if (criteria.restaurantId) {
        query.restaurant = criteria.restaurantId;
      }
      
      if (criteria.query) {
        query.$or = [
          { name: new RegExp(criteria.query, 'i') },
          { description: new RegExp(criteria.query, 'i') },
        ];
      }
      
      if (criteria.category) {
        query.category = criteria.category;
      }

      let menuItems = await MenuItem.find(query).limit(20);

      // Apply health filters
      if (healthProfile && criteria.healthFilters) {
        menuItems = menuItems.filter(item => {
          return this.applyHealthFilters(item, healthProfile, criteria.healthFilters);
        });
      }

      return menuItems;
    } catch (error) {
      console.error('Menu item search error:', error);
      return [];
    }
  }

  private isHealthyForUser(item: any, healthProfile?: any): boolean {
    if (!healthProfile) return true;

    // Check allergies
    if (healthProfile.allergies && item.allergens) {
      for (const allergy of healthProfile.allergies) {
        if (item.allergens.includes(allergy.allergen)) {
          return false;
        }
      }
    }

    // Check dietary preferences
    if (healthProfile.dietaryPreferences && item.dietaryTags) {
      if (healthProfile.dietaryPreferences.includes('vegan') && !item.dietaryTags.includes('vegan')) {
        return false;
      }
      if (healthProfile.dietaryPreferences.includes('vegetarian') && !item.dietaryTags.includes('vegetarian')) {
        return false;
      }
      if (healthProfile.dietaryPreferences.includes('gluten-free') && !item.dietaryTags.includes('gluten-free')) {
        return false;
      }
    }

    // Check calorie limits
    if (healthProfile.dailyCalorieGoal && item.nutritionalInfo?.calories) {
      const mealCalorieLimit = healthProfile.dailyCalorieGoal / 3; // Rough estimate for one meal
      if (item.nutritionalInfo.calories > mealCalorieLimit * 1.5) { // Allow 50% over meal limit
        return false;
      }
    }

    return true;
  }

  private getHealthWarnings(item: any, healthProfile?: any): string[] {
    const warnings: string[] = [];
    
    if (!healthProfile) return warnings;

    // Check allergies
    if (healthProfile.allergies && item.allergens) {
      for (const allergy of healthProfile.allergies) {
        if (item.allergens.includes(allergy.allergen)) {
          warnings.push(`Contains ${allergy.allergen} (${allergy.severity} allergy)`);
        }
      }
    }

    // Check dietary restrictions
    if (healthProfile.dietaryPreferences) {
      if (healthProfile.dietaryPreferences.includes('vegan') && (!item.dietaryTags || !item.dietaryTags.includes('vegan'))) {
        warnings.push('Not vegan');
      }
      if (healthProfile.dietaryPreferences.includes('low-sodium') && item.nutritionalInfo?.sodium > 1000) {
        warnings.push('High in sodium');
      }
    }

    // Check calories
    if (healthProfile.dailyCalorieGoal && item.nutritionalInfo?.calories) {
      const mealCalorieLimit = healthProfile.dailyCalorieGoal / 3;
      if (item.nutritionalInfo.calories > mealCalorieLimit * 1.5) {
        warnings.push(`High calorie (${item.nutritionalInfo.calories} cal)`);
      }
    }

    return warnings;
  }

  private applyHealthFilters(item: any, healthProfile: any, filters: any): boolean {
    // Apply custom health filters
    if (filters.maxCalories && item.nutritionalInfo?.calories > filters.maxCalories) {
      return false;
    }
    
    if (filters.dietaryTags && item.dietaryTags && !filters.dietaryTags.every((tag: string) => 
      item.dietaryTags.includes(tag)
    )) {
      return false;
    }

    return this.isHealthyForUser(item, healthProfile);
  }

  async getHealthAwareSuggestions(
    userId: string,
    healthProfile: any,
    criteria: any
  ): Promise<any[]> {
    try {
      const query: any = {};
      
      if (criteria.cuisine) {
        query.cuisine = criteria.cuisine;
      }
      
      if (criteria.maxCalories) {
        query['nutritionalInfo.calories'] = { $lte: criteria.maxCalories };
      }

      // Apply health profile filters
      if (healthProfile?.dietaryPreferences) {
        query.dietaryTags = { $in: healthProfile.dietaryPreferences };
      }

      if (healthProfile?.allergies) {
        const allergens = healthProfile.allergies.map((a: any) => a.allergen);
        query.allergens = { $nin: allergens };
      }

      const suggestions = await MenuItem.find(query)
        .sort({ healthScore: -1, rating: -1 })
        .limit(10);

      return suggestions;
    } catch (error) {
      console.error('Health suggestions error:', error);
      return [];
    }
  }

  private async addToCart(userId: string, itemData: any): Promise<void> {
    // Get menu item to get price
    const menuItem = await MenuItem.findById(itemData.menuItemId);
    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    const cart = await Cart.findOne({ user: userId }) || new Cart({ user: userId, items: [] });
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.menuItem.toString() === itemData.menuItemId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += itemData.quantity;
    } else {
      cart.items.push({
        menuItem: itemData.menuItemId,
        quantity: itemData.quantity,
        price: menuItem.price,
        customization: itemData.customization,
      });
    }

    await cart.save();
  }

  private async reorderPrevious(userId: string, orderId: string): Promise<void> {
    const order = await Order.findById(orderId).populate('items.menuItem');
    if (!order || order.user.toString() !== userId) {
      throw new Error('Order not found or unauthorized');
    }

    const cart = await Cart.findOne({ user: userId }) || new Cart({ user: userId, items: [] });
    
    for (const item of order.items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (menuItem) {
        cart.items.push({
          menuItem: item.menuItem,
          quantity: item.quantity,
          price: menuItem.price,
          customization: item.customization,
        });
      }
    }
    
    await cart.save();
  }

  private async placeOrder(userId: string, orderData: any): Promise<any> {
    const cart = await Cart.findOne({ user: userId }).populate('items.menuItem');
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    // Get the restaurant from the first item
    const firstMenuItem = await MenuItem.findById(cart.items[0].menuItem).populate('restaurant');
    
    const order = new Order({
      user: userId,
      restaurant: firstMenuItem?.restaurant._id,
      items: cart.items.map(item => ({
        menuItem: item.menuItem._id || item.menuItem,
        quantity: item.quantity,
        customization: item.customization,
        price: item.price,
      })),
      totalAmount: cart.items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      ),
      deliveryAddress: orderData.deliveryAddress,
      paymentMethod: orderData.paymentMethod,
      status: 'pending',
    });

    await order.save();
    
    // Clear cart
    cart.items = [];
    await cart.save();

    return order;
  }

  async saveVoiceSession(userId: string, sessionId: string, sessionData: VoiceSessionData): Promise<VoiceSessionData> {
    try {
      let dbSession = await VoiceSession.findActiveSession(sessionId);
      
      if (!dbSession) {
        dbSession = await VoiceSession.createSession(userId, sessionId);
      }

      // Update session with provided data
      if (sessionData.conversationData) {
        dbSession.context = { ...dbSession.context, ...sessionData.conversationData };
      }
      
      if (sessionData.orderDetails) {
        dbSession.orderDetails = sessionData.orderDetails;
      }

      await dbSession.save();

      return {
        sessionId: dbSession.sessionId,
        conversationData: dbSession.context,
        orderDetails: dbSession.orderDetails,
        timestamp: dbSession.updatedAt,
      };
    } catch (error) {
      console.error('Save session error:', error);
      throw new Error('Failed to save session');
    }
  }

  getConversationState(sessionId: string): VoiceConversationState | undefined {
    return quickStateCache.get(sessionId);
  }

  clearConversationState(sessionId: string): boolean {
    // Clear from cache
    const cacheCleared = quickStateCache.delete(sessionId);
    
    // Mark session as inactive in database
    VoiceSession.findActiveSession(sessionId)
      .then(session => {
        if (session) {
          session.isActive = false;
          session.save();
        }
      })
      .catch(error => console.error('Error clearing database session:', error));

    return cacheCleared;
  }
}

export const voiceService = new VoiceService();