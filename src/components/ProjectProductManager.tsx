import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, X, Trash2, Pencil } from 'lucide-react';
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editImages, setEditImages] = useState<File[]>([]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    description: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    project_id: ''
  });

  const categories = [
    'Chaussures',
    'Sweats',
    'Vestes',
    'Pantalons',
    'T-shirts',
    'Sous-vêtements',
    'Accessoires',
    'Robes',
    'Jupes'
  ];

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchProducts();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
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

      const createdProjectsData = createdProjects.data || [];
      const memberProjectsData = memberProjects.data?.map(m => m.projects).filter(Boolean) || [];
      
      const allProjectsMap = new Map();
      
      createdProjectsData.forEach(project => {
        allProjectsMap.set(project.id, project);
      });
      
      memberProjectsData.forEach(project => {
        if (!allProjectsMap.has(project.id)) {
          allProjectsMap.set(project.id, project);
        }
      });
      
      const uniqueProjects = Array.from(allProjectsMap.values());
      
      setProjects(uniqueProjects);
      if (uniqueProjects.length > 0 && !selectedProject) {
        setSelectedProject(uniqueProjects[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProducts = async () => {
    try {
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

      const createdProjectIds = createdProjects.data?.map(p => p.id) || [];
      const memberProjectIds = memberProjects.data?.map(m => m.project_id) || [];
      
      const uniqueProjectIds = [...new Set([...createdProjectIds, ...memberProjectIds])];

      if (uniqueProjectIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          projects(name)
        `)
        .in('project_id', uniqueProjectIds);

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

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setEditImages(prev => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const image of images) {
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
      
      const imageUrls = selectedImages.length > 0 ? await uploadImages(selectedImages) : [];
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

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description || '',
      project_id: product.project_id
    });
    setEditImages([]);
    setEditDialogOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    if (!editForm.name || !editForm.category || !editForm.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      
      let imageUrls = editingProduct.images || [];
      
      if (editImages.length > 0) {
        const newImageUrls = await uploadImages(editImages);
        imageUrls = [...imageUrls, ...newImageUrls].slice(0, 5);
      }

      const projectName = projects.find(p => p.id === editForm.project_id)?.name || editingProduct.brand;

      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          brand: projectName,
          category: editForm.category,
          price: parseFloat(editForm.price),
          description: editForm.description,
          images: imageUrls,
          project_id: editForm.project_id
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditImages([]);
      fetchProducts();
      toast.success('Produit mis à jour avec succès!');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = async (imageUrl: string) => {
    if (!editingProduct) return;

    const updatedImages = editingProduct.images.filter(img => img !== imageUrl);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ images: updatedImages })
        .eq('id', editingProduct.id);

      if (error) throw error;

      setEditingProduct({ ...editingProduct, images: updatedImages });
      toast.success('Image supprimée');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Erreur lors de la suppression de l\'image');
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

  if (loading && products.length === 0) {
    return <div className="text-center p-4">Chargement...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground mb-4">
          Vous devez d'abord créer un projet dans l'onglet "Mes Projets" pour pouvoir ajouter des produits.
        </p>
      </div>
    );
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

            <Select value={newProduct.category} onValueChange={(value) => setNewProduct({ ...newProduct, category: value })} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-md hover:border-primary">
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
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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

      {/* Edit Product Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <Select value={editForm.project_id} onValueChange={(value) => setEditForm({ ...editForm, project_id: value })}>
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
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />

            <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              step="0.01"
              placeholder="Prix (€)"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              required
            />

            <Textarea
              placeholder="Description"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />

            {/* Existing Images */}
            {editingProduct?.images && editingProduct.images.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Images actuelles</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {editingProduct.images.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(imageUrl)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Ajouter des images</label>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-md hover:border-primary">
                      <Upload className="h-4 w-4" />
                      <span>Choisir des images</span>
                    </div>
                  </label>
                </div>

                {editImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {editImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Mise à jour...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
