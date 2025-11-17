-- Create table for user email-to-name mappings
CREATE TABLE public.user_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sdr', 'closer')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (email, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read mappings
CREATE POLICY "Anyone can view user mappings" 
ON public.user_mappings 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert mappings
CREATE POLICY "Anyone can create user mappings" 
ON public.user_mappings 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to update mappings
CREATE POLICY "Anyone can update user mappings" 
ON public.user_mappings 
FOR UPDATE 
USING (true);

-- Create policy to allow anyone to delete mappings
CREATE POLICY "Anyone can delete user mappings" 
ON public.user_mappings 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_mappings_updated_at
BEFORE UPDATE ON public.user_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_user_mappings_updated_at();