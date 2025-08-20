import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Upload, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  project_id: string;
  projects?: { name: string };
}

export const ProjectProductManager = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchProducts();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      // Fetch projects where user is creator or member
      const [createdProjects, memberProjects] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name')
          .eq('creator_id', user?.id),
        supabase
          .from('project_members')
          .select('project_id, projects!inner(id, name)')
          .eq('user_id', user?.id)
      ]);

      if (createdProjects.error) throw createdProjects.error;
      if (memberProjects.error) throw memberProjects.error;

      const allProjects = [
        ...(createdProjects.data || []),
        ...(memberProjects.data?.map(m => m.projects).filter(Boolean) || [])
      ];

      setProjects(allProjects);
      if (allProjects.length > 0 && !selectedProject) {
        setSelectedProject(allProjects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // First get all project IDs where user is creator or member
      const [createdProjects, memberProjects] = await Promise.all([
        supabase
          .from('projects')
          .select('id')
          .eq('creator_id', user?.id),
        supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user?.id)
      ]);

      if (createdProjects.error) throw createdProjects.error;
      if (memberProjects.error) throw memberProjects.error;

      const allProjectIds = [
        ...(createdProjects.data?.map(p => p.id) || []),
        ...(memberProjects.data?.map(m => m.project_id) || [])
      ];

      if (allProjectIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch products only from user's projects
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          projects(name)
        `)
        .in('project_id', allProjectIds);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const image of selectedImages) {
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrls.push(data.publicUrl);
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Veuillez sélectionner un projet');
      return;
    }

    if (!newProduct.name || !newProduct.category || !newProduct.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      const imageUrls = selectedImages.length > 0 ? await uploadImages() : [];
      const projectName = projects.find(p => p.id === selectedProject)?.name || '';

      const { error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          brand: projectName,
          category: newProduct.category,
          price: parseFloat(newProduct.price),
          description: newProduct.description,
          images: imageUrls,
          user_id: user?.id,
          project_id: selectedProject
        });

      if (error) throw error;

      setNewProduct({ name: '', category: '', price: '', description: '' });
      setSelectedImages([]);
      fetchProducts();
      toast.success('Produit ajouté avec succès!');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produit supprimé');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Ajouter un produit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={selectedProject} onValueChange={setSelectedProject} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un projet" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Nom du produit"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />

            <Input
              placeholder="Catégorie"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              required
            />

            <Input
              type="number"
              step="0.01"
              placeholder="Prix (€)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              required
            />

            <Textarea
              placeholder="Description"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium mb-2">Images (max 5)</label>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md hover:border-gray-400">
                      <Upload className="h-4 w-4" />
                      <span>Choisir des images</span>
                    </div>
                  </label>
                </div>

                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={loading || projects.length === 0}>
              {loading ? 'Ajout...' : 'Ajouter le produit'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes produits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.filter(product => 
              projects.some(project => project.id === product.project_id)
            ).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {product.projects?.name} • {product.category} • {product.price}€
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {products.filter(product => 
              projects.some(project => project.id === product.project_id)
            ).length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun produit trouvé
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};