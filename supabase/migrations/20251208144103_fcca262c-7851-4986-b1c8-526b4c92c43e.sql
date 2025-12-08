-- Create support tickets table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'support', -- 'support', 'report_product', 'report_user'
  reported_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  reported_user_id uuid,
  status text NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  admin_response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Admins can delete tickets
CREATE POLICY "Admins can delete tickets" 
ON public.support_tickets 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();