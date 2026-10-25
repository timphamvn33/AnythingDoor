import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Clock3, LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth.context';
import {
  approveOwnerRestaurant,
  askBuyerChat,
  askOwnerChat,
  getChatStatus,
  type ChatMessagePayload,
  type RestaurantProposal,
  type RestaurantRecommendation,
} from '@/services/chat.service';

type ChatMode = 'buyer' | 'owner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  restaurants?: RestaurantRecommendation[];
  proposal?: RestaurantProposal;
  createdRestaurant?: { id: string; name: string };
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function Chatbot() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isOwner = Boolean(user?.role.includes('restaurant_owner'));
  const requestedMode = new URLSearchParams(location.search).get('mode');
  const [mode, setMode] = useState<ChatMode>(
    isOwner && requestedMode !== 'buyer' ? 'owner' : 'buyer',
  );
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [statusError, setStatusError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState<number | null>(null);
  const canChat = configured === true && !statusError;

  useEffect(() => {
    let active = true;
    getChatStatus()
      .then(status => {
        if (active) setConfigured(status.configured);
      })
      .catch(() => {
        if (active) setStatusError('Cannot connect to the chatbot service right now.');
      });
    return () => {
      active = false;
    };
  }, []);

  const greeting = useMemo(
    () =>
      mode === 'owner'
        ? 'Tell me what kind of restaurant you want to start, what you plan to serve, and any location or audience you have in mind. I will draft a concept for you to review.'
        : 'What are you looking for today? Tell me about the meal, occasion, or food you need, and I will look for matching restaurants in our database.',
    [mode],
  );

  useEffect(() => {
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [greeting]);

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message || !canChat || sending) return;

    const history: ChatMessagePayload[] = messages.slice(-12).map(({ role, content }) => ({
      role,
      content,
    }));
    setMessages(current => [...current, { role: 'user', content: message }]);
    setInput('');
    setSending(true);

    try {
      if (mode === 'owner') {
        const result = await askOwnerChat(message, history);
        setMessages(current => [
          ...current,
          { role: 'assistant', content: result.reply, proposal: result.proposal },
        ]);
      } else {
        const result = await askBuyerChat(message, history);
        setMessages(current => [
          ...current,
          { role: 'assistant', content: result.reply, restaurants: result.restaurants },
        ]);
      }
    } catch (error) {
      setMessages(current => [...current, { role: 'assistant', content: getErrorMessage(error) }]);
    } finally {
      setSending(false);
    }
  };

  const approveProposal = async (index: number, proposal: RestaurantProposal) => {
    setApprovingIndex(index);
    try {
      const restaurant = await approveOwnerRestaurant(proposal);
      setMessages(current =>
        current.map((message, messageIndex) =>
          messageIndex === index
            ? { ...message, proposal: undefined, createdRestaurant: restaurant }
            : message,
        ),
      );
    } catch (error) {
      setMessages(current => [...current, { role: 'assistant', content: getErrorMessage(error) }]);
    } finally {
      setApprovingIndex(null);
    }
  };

  const discardProposal = (index: number) => {
    setMessages(current =>
      current.map((message, messageIndex) =>
        messageIndex === index ? { ...message, proposal: undefined } : message,
      ),
    );
  };

  const switchMode = (nextMode: ChatMode) => {
    setMode(nextMode);
    navigate(`/chat?mode=${nextMode}`, { replace: true });
  };

  return (
    <PageWrapper>
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-5xl flex-col px-4 py-8">
        <header className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-100 p-3 text-orange-700">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AnythingDoor assistant</h1>
              <p className="text-sm text-gray-600">
                {mode === 'owner' ? 'Plan a restaurant business' : 'Find food for what you need'}
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                variant={mode === 'buyer' ? 'default' : 'outline'}
                onClick={() => switchMode('buyer')}
              >
                Find restaurants
              </Button>
              <Button
                type="button"
                variant={mode === 'owner' ? 'default' : 'outline'}
                onClick={() => switchMode('owner')}
              >
                Business ideas
              </Button>
            </div>
          )}
        </header>

        {!canChat && (
          <section className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <h2 className="font-semibold">
              {statusError ? 'Chatbot service unavailable' : 'Chatbot setup pending'}
            </h2>
            <p className="mt-1">
              {statusError ||
                'The chatbot interface is ready, but AI replies are disabled until the backend is configured.'}
            </p>
            {!statusError && (
              <p className="mt-2">
                Add <code className="rounded bg-amber-100 px-1">OPENAI_API_KEY</code> to the backend
                environment, then restart the backend. Optional:{' '}
                <code className="rounded bg-amber-100 px-1">OPENAI_BASE_URL</code> and{' '}
                <code className="rounded bg-amber-100 px-1">OPENAI_MODEL</code>.
              </p>
            )}
          </section>
        )}

        <section
          aria-label="Chat conversation"
          aria-live="polite"
          className="flex min-h-[420px] flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border bg-white p-4 shadow-sm sm:p-6"
        >
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[82%] ${
                  message.role === 'user' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                {message.restaurants && message.restaurants.length > 0 && (
                  <div className="mt-3 grid gap-3">
                    {message.restaurants.map(restaurant => (
                      <article
                        key={restaurant.id}
                        className="rounded-xl border bg-white p-3 text-gray-900"
                      >
                        <h3 className="font-semibold">{restaurant.name}</h3>
                        {restaurant.description && (
                          <p className="mt-1 text-sm text-gray-600">{restaurant.description}</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                          {restaurant.category.join(' · ')}
                        </p>
                        {restaurant.menuItems.length > 0 && (
                          <p className="mt-2 text-sm">
                            Available menu: {restaurant.menuItems.map(item => item.name).join(', ')}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          {restaurant.openHrs}–{restaurant.closeHrs}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3"
                          onClick={() => navigate(`/landing/store/${restaurant.id}`)}
                        >
                          View restaurant
                        </Button>
                      </article>
                    ))}
                  </div>
                )}

                {message.proposal && (
                  <article className="mt-3 rounded-xl border bg-white p-4 text-gray-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-orange-600" />
                      <h3 className="font-semibold">{message.proposal.name}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">{message.proposal.description}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-medium">Business type:</span>{' '}
                      {message.proposal.category.join(' · ')}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium">Hours:</span> {message.proposal.openHrs}–
                      {message.proposal.closeHrs}
                    </p>
                    <p className="mt-3 text-sm font-medium">Menu ideas (not created)</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
                      {message.proposal.menuIdeas.map(idea => (
                        <li key={idea}>{idea}</li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={approvingIndex !== null}
                        onClick={() => approveProposal(index, message.proposal!)}
                      >
                        {approvingIndex === index ? (
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Approve and create restaurant
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={approvingIndex !== null}
                        onClick={() => discardProposal(index)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Discard draft
                      </Button>
                    </div>
                  </article>
                )}

                {message.createdRestaurant && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-700" />
                    <span>Restaurant created: {message.createdRestaurant.name}</span>
                    <Link
                      className="font-medium underline"
                      to={`/landing/store/${message.createdRestaurant.id}`}
                    >
                      View it
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </section>

        <form onSubmit={submitMessage} className="mt-4 flex gap-2">
          <Input
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder={
              mode === 'owner'
                ? 'Describe the restaurant you want to start…'
                : 'What do you need today?'
            }
            aria-label="Your message"
            maxLength={2000}
            disabled={!canChat || sending}
          />
          <Button type="submit" disabled={!canChat || sending || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {mode === 'owner' && isOwner && (
          <p className="mt-2 text-xs text-gray-500">
            Nothing is saved until you review the proposal and choose “Approve and create
            restaurant.” Menu suggestions are ideas only.
          </p>
        )}
      </main>
    </PageWrapper>
  );
}
