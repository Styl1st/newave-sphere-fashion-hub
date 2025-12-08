import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import BrandNavbar from '@/components/BrandNavbar';
import { useMessages, useConversation, Conversation, Message } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Send, ArrowLeft, User, Package, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const Inbox = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { conversations, loading, deleteConversation } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  
  // Get productId from URL params (when coming from product page)
  const initialProductId = searchParams.get('productId');

  useEffect(() => {
    // Auto-select conversation if coming from a product page with a specific conversation
    const conversationId = searchParams.get('conversationId');
    if (conversationId && conversations.length > 0) {
      const convo = conversations.find(c => c.id === conversationId);
      if (convo) setSelectedConversation(convo);
    }
  }, [searchParams, conversations]);

  const handleDeleteConversation = async (conversationId: string) => {
    const success = await deleteConversation(conversationId);
    if (success) {
      setSelectedConversation(null);
      navigate('/inbox');
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-animated-fade">
      <BrandNavbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh] border rounded-xl overflow-hidden bg-card">
          {/* Conversations List */}
          <div className={`md:col-span-1 border-r ${selectedConversation ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <ScrollArea className="h-[calc(70vh-60px)]">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Chargement...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune conversation</p>
                </div>
              ) : (
                conversations.map((convo) => (
                  <ConversationItem
                    key={convo.id}
                    conversation={convo}
                    isSelected={selectedConversation?.id === convo.id}
                    onClick={() => setSelectedConversation(convo)}
                  />
                ))
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`md:col-span-2 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
            {selectedConversation ? (
              <ChatArea
                conversation={selectedConversation}
                currentUserId={user.id}
                onBack={() => setSelectedConversation(null)}
                onDelete={() => handleDeleteConversation(selectedConversation.id)}
                initialProductId={initialProductId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const ConversationItem = ({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
        isSelected ? 'bg-muted' : ''
      }`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
        <AvatarFallback>
          <User className="w-5 h-5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium truncate">
            {conversation.other_user?.full_name || 'Utilisateur'}
          </span>
          {conversation.unread_count ? (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {conversation.unread_count}
            </span>
          ) : null}
        </div>
        {conversation.last_message && (
          <p className="text-sm text-muted-foreground truncate">
            {conversation.last_message.content}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(conversation.updated_at), {
            addSuffix: true,
            locale: fr,
          })}
        </p>
      </div>
    </button>
  );
};

const ProductCard = ({ product, isOwn }: { product: Message['product']; isOwn: boolean }) => {
  if (!product) return null;
  
  return (
    <Link 
      to={`/product/${product.id}`}
      className={`flex items-center gap-3 p-2 rounded-lg mb-2 transition-colors ${
        isOwn ? 'bg-primary-foreground/10 hover:bg-primary-foreground/20' : 'bg-background/50 hover:bg-background/80'
      }`}
    >
      {product.images?.[0] ? (
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-12 h-12 object-cover rounded-md"
        />
      ) : (
        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
          {product.name}
        </p>
        <p className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {product.price?.toFixed(2)} €
        </p>
      </div>
    </Link>
  );
};

const ChatArea = ({
  conversation,
  currentUserId,
  onBack,
  onDelete,
  initialProductId,
}: {
  conversation: Conversation;
  currentUserId: string;
  onBack: () => void;
  onDelete: () => void;
  initialProductId?: string | null;
}) => {
  const { messages, loading, sendMessage } = useConversation(conversation.id);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string | null>(initialProductId || null);
  const [pendingProduct, setPendingProduct] = useState<Message['product']>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch pending product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (pendingProductId) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('products')
          .select('id, name, images, price')
          .eq('id', pendingProductId)
          .maybeSingle();
        setPendingProduct(data);
      } else {
        setPendingProduct(null);
      }
    };
    fetchProduct();
  }, [pendingProductId]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await sendMessage(newMessage, pendingProductId);
    setNewMessage('');
    setPendingProductId(null);
    setPendingProduct(null);
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Link to={`/seller/${conversation.other_user?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={conversation.other_user?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium hover:underline">{conversation.other_user?.full_name || 'Utilisateur'}</p>
          </div>
        </Link>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
              <Trash2 className="w-5 h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la conversation ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Tous les messages de cette conversation seront supprimés définitivement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Messages - scrollable area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollRef}>
          {loading ? (
            <div className="text-center text-muted-foreground">Chargement...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Aucun message. Commencez la conversation !</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.product && (
                      <ProductCard product={msg.product} isOwn={msg.sender_id === currentUserId} />
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_id === currentUserId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Pending Product Preview */}
      {pendingProduct && (
        <div className="px-4 py-2 border-t bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Produit attaché:</span>
            <div className="flex items-center gap-2 flex-1">
              {pendingProduct.images?.[0] && (
                <img src={pendingProduct.images[0]} alt="" className="w-8 h-8 object-cover rounded" />
              )}
              <span className="text-sm font-medium truncate">{pendingProduct.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setPendingProductId(null); setPendingProduct(null); }}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Input - fixed at bottom */}
      <div className="p-4 border-t flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Écrivez votre message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Inbox;
