import { OpenAI } from 'openai';
import Order from '../models/order.model';
import { MenuItem } from '../models/menu.model';
import { Customer } from '../models/customer.model';
import { DeliveryRoute } from '../models/delivery.model';
import { PriceHistory } from '../models/price.model';
import { SupportTicket } from '../models/support.model';
import { config } from '../config';
import mongoose from 'mongoose';

interface ISupportTicket extends mongoose.Document {
  customer: mongoose.Types.ObjectId;
  order?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'delivery' | 'payment' | 'account' | 'other';
  assignedTo?: mongoose.Types.ObjectId;
  responses: Array<{
    content: string;
    responder: mongoose.Types.ObjectId;
    responderType: 'SupportAgent' | 'Customer' | 'AI';
    timestamp: Date;
  }>;
  aiAnalysis?: {
    sentiment: string;
    intent: string;
    suggestedResponse: string;
    confidence: number;
  };
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;

const initializeOpenAI = (): OpenAI => {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: config.openaiApiKey,
      maxRetries: 3,
      timeout: 30000,
    });
  }
  return openai;
};

const isOpenAIAvailable = (): boolean => {
  try {
    if (!config.openaiApiKey) return false;
    // Validate API key format (sk-...)
    return config.openaiApiKey.startsWith('sk-') && config.openaiApiKey.length > 20;
  } catch (error) {
    console.error('Error checking OpenAI availability:', error);
    return false;
  }
};

export class AIService {
  // Menu Optimization
  async analyzeMenuItems(): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const menuItems = await MenuItem.find();
    const orders = await Order.find().populate('items');
    
    // Analyze popularity, pricing, and customer preferences
    const client = initializeOpenAI();
    const analysis = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze menu items based on order history and customer preferences"
        },
        {
          role: "user",
          content: JSON.stringify({
            menuItems,
            orders,
            task: "Analyze menu performance and suggest optimizations"
          })
        }
      ]
    });

    return analysis.choices[0].message.content;
  }

  // Predictive Ordering
  async predictOrders(customerId: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const customer = await Customer.findById(customerId);
    const orderHistory = await Order.find({ customer: customerId });
    
    const client = initializeOpenAI();
    const prediction = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Predict future orders based on customer history and patterns"
        },
        {
          role: "user",
          content: JSON.stringify({
            customer,
            orderHistory,
            task: "Predict likely future orders"
          })
        }
      ]
    });

    return prediction.choices[0].message.content;
  }

  // Route Optimization
  async optimizeDeliveryRoute(orderId: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const order = await Order.findById(orderId);
    const activeDeliveries = await DeliveryRoute.find({ status: 'active' });
    
    const client = initializeOpenAI();
    const optimization = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Optimize delivery routes for efficiency"
        },
        {
          role: "user",
          content: JSON.stringify({
            order,
            activeDeliveries,
            task: "Optimize delivery route"
          })
        }
      ]
    });

    return optimization.choices[0].message.content;
  }

  // Demand Forecasting
  async forecastDemand(): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const historicalOrders = await Order.find();
    const priceHistory = await PriceHistory.find();
    
    const client = initializeOpenAI();
    const forecast = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Forecast demand based on historical data"
        },
        {
          role: "user",
          content: JSON.stringify({
            historicalOrders,
            priceHistory,
            task: "Forecast future demand"
          })
        }
      ]
    });

    return forecast.choices[0].message.content;
  }

  // Automated Customer Support
  async handleSupportTicket(ticketId: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const ticket = await SupportTicket.findById(ticketId) as ISupportTicket | null;
    if (!ticket) {
      throw new Error('Support ticket not found');
    }

    const customer = await Customer.findById(ticket.customer);
    if (!customer) {
      throw new Error('Customer not found for this ticket');
    }
    
    const client = initializeOpenAI();
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Handle customer support tickets efficiently"
        },
        {
          role: "user",
          content: JSON.stringify({
            ticket,
            customer,
            task: "Generate support response"
          })
        }
      ]
    });

    return response.choices[0].message.content;
  }

  // Dynamic Pricing
  async calculateDynamicPrice(itemId: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const item = await MenuItem.findById(itemId);
    const priceHistory = await PriceHistory.find({ item: itemId });
    const currentDemand = await this.forecastDemand();
    
    const client = initializeOpenAI();
    const pricing = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Calculate optimal price based on demand and market conditions"
        },
        {
          role: "user",
          content: JSON.stringify({
            item,
            priceHistory,
            currentDemand,
            task: "Calculate optimal price"
          })
        }
      ]
    });

    return pricing.choices[0].message.content;
  }

  // Semantic Search
  async semanticSearch(query: string, type: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const client = initializeOpenAI();
    const search = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Perform semantic search across the platform"
        },
        {
          role: "user",
          content: JSON.stringify({
            query,
            type,
            task: "Find relevant results"
          })
        }
      ]
    });

    return search.choices[0].message.content;
  }

  // Get Personalized Recommendations
  async getPersonalizedRecommendations(userId: string): Promise<any> {
    if (!isOpenAIAvailable()) {
      throw new Error('OpenAI API key not configured. AI features are not available.');
    }

    const customer = await Customer.findById(userId);
    const orderHistory = await Order.find({ customer: userId });
    
    const client = initializeOpenAI();
    const recommendations = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate personalized recommendations"
        },
        {
          role: "user",
          content: JSON.stringify({
            customer,
            orderHistory,
            task: "Generate recommendations"
          })
        }
      ]
    });

    return recommendations.choices[0].message.content;
  }
}

export const aiService = new AIService(); 