export interface ChatMessageDto {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestDto {
  message: string;
  history?: ChatMessageDto[];
}

export interface OwnerChatRequestDto extends ChatRequestDto {
  businessType?: string;
  serves?: string;
  location?: string;
}

export interface RestaurantProposalDto {
  name: string;
  description: string;
  logoUrl: string;
  category: string[];
  openHrs: string;
  closeHrs: string;
  menuIdeas: string[];
}

export interface ApproveRestaurantDto {
  name: string;
  description: string;
  logoUrl: string;
  category: string[];
  openHrs: string;
  closeHrs: string;
}
