import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Database } from '@/types/database.types'

type Listing = Database['public']['Tables']['listings']['Insert']

const listingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  price_amount: z.number().min(1, 'Price must be greater than 0'),
  currency: z.string().default('DKK'),
})

type ListingFormData = z.infer<typeof listingSchema>

export default function Sell() {
  const navigate = useNavigate()
  const { user, isBanned, loading } = useAuth()
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)


  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
  })

  // Redirect if not authenticated or banned
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  if (isBanned) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Banned</h1>
          <p className="text-muted-foreground">
            Your account has been banned. You cannot create new listings.
          </p>
        </div>
      </div>
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select only image files')
          continue
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB')
          continue
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `listings/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          alert('Failed to upload image')
          continue
        }

        const { data } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath)

        uploadedUrls.push(data.publicUrl)
      }

      setImages(prev => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('Error uploading images:', error)
      alert('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: ListingFormData) => {
    if (images.length === 0) {
      alert('Please upload at least one image')
      return
    }

    setSubmitting(true)

    try {
      const listingData: Listing = {
        ...data,
        // Convert DKK to øre (multiply by 100)
        price_amount: Math.round(data.price_amount * 100),
        seller_id: user.id,
        images,
      }

      const { error } = await supabase
        .from('listings')
        .insert(listingData)

      if (error) {
        console.error('Error creating listing:', error)
        alert('Failed to create listing')
        return
      }

      alert('Listing created successfully!')
      navigate('/account')
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Listing</h1>
        <p className="text-muted-foreground">
          List an item for sale on the marketplace
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listing Details</CardTitle>
          <CardDescription>
            Fill in the details about the item you want to sell
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter item title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                {...register('description')}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your item in detail"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_amount">Price (DKK)</Label>
              <Input
                id="price_amount"
                type="number"
                step="0.01"
                {...register('price_amount', { valueAsNumber: true })}
                placeholder="1500"
              />
              {errors.price_amount && (
                <p className="text-sm text-destructive">{errors.price_amount.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter price in Danish Kroner (DKK). Example: 1500 for DKK 1,500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="images">Images</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={submitting || uploading}>
                {submitting ? 'Creating...' : 'Create Listing'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/account')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
