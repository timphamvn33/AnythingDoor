import api from '@/api/axios';
import { CHAT_ENDPOINTS } from '@/api/endpoints';

export interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

export interface RestaurantRecommendation {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string;
  category: string[];
  openHrs: string;
  closeHrs: string;
  menuItems: Array<{
    name: string;
    description: string | null;
    category: string[];
  }>;
}

export interface RestaurantProposal {
  name: string;
  description: string;
  logoUrl: string;
  category: string[];
  openHrs: string;
  closeHrs: string;
  menuIdeas: string[];
}

export interface ChatStatus {
  configured: boolean;
  provider: string;
}

export const getChatStatus = async () => (await api.get<ChatStatus>(CHAT_ENDPOINTS.STATUS)).data;

export const askBuyerChat = async (message: string, history: ChatMessagePayload[]) =>
  (
    await api.post<{ reply: string; restaurants: RestaurantRecommendation[] }>(
      CHAT_ENDPOINTS.BUYER,
      { message, history },
    )
  ).data;

export const askOwnerChat = async (message: string, history: ChatMessagePayload[]) =>
  (
    await api.post<{ reply: string; proposal: RestaurantProposal }>(CHAT_ENDPOINTS.OWNER_PROPOSE, {
      message,
      history,
    })
  ).data;

export const approveOwnerRestaurant = async (proposal: RestaurantProposal) =>
  (
    await api.post<{ id: string; name: string }>(CHAT_ENDPOINTS.OWNER_APPROVE, {
      name: proposal.name,
      description: proposal.description,
      logoUrl: proposal.logoUrl,
      category: proposal.category,
      openHrs: proposal.openHrs,
      closeHrs: proposal.closeHrs,
    })
  ).data;
