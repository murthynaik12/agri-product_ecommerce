"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { Upload, X } from "lucide-react"

interface Product {
  _id?: string
  name: string
  category: string
  price: number
  stock?: number
  rating?: number
  image?: string
}

export default function FarmerProducts() {
  const { user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
    image: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [editProduct, setEditProduct] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    description: "",
    image: "",
  })
  const [editImagePreview, setEditImagePreview] = useState<string>("")

  useEffect(() => {
    loadProducts()
  }, [user])

  const loadProducts = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const data = await fetchProducts(user.id)
      setProducts(data)
    } catch (error) {
      console.error("Failed to load products:", error)
      alert("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "add" | "edit") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        if (type === "add") {
          setNewProduct({ ...newProduct, image: result })
          setImagePreview(result)
        } else {
          setEditProduct({ ...editProduct, image: result })
          setEditImagePreview(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = (type: "add" | "edit") => {
    if (type === "add") {
      setNewProduct({ ...newProduct, image: "" })
      setImagePreview("")
    } else {
      setEditProduct({ ...editProduct, image: "" })
      setEditImagePreview("")
    }
  }

  const handleAddProduct = async () => {
    if (newProduct.name && newProduct.category && newProduct.price && newProduct.quantity) {
      if (!user || !user.id) {
        alert("User not authenticated. Please log in again.")
        return
      }

      try {
        const createdProduct = await createProduct({
          name: newProduct.name,
          category: newProduct.category,
          price: Number.parseFloat(newProduct.price),
          stock: Number.parseFloat(newProduct.quantity),
          farmerId: user.id,
          farmerName: user.name || "Unknown Farmer",
          rating: 0,
          image: newProduct.image || undefined,
        })
        setProducts([...products, createdProduct])
        setShowAddModal(false)
        setNewProduct({ name: "", category: "", price: "", quantity: "", description: "", image: "" })
        setImagePreview("")
      } catch (error) {
        console.error("Failed to add product:", error)
        alert("Failed to add product")
      }
    }
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditProduct({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      quantity: (product.stock || 0).toString(),
      description: "",
      image: product.image || "",
    })
    setEditImagePreview(product.image || "")
    setShowEditModal(true)
  }

  const handleConfirmEdit = async () => {
    if (editProduct.name && editProduct.category && editProduct.price && editProduct.quantity && selectedProduct?._id) {
      try {
        await updateProduct(selectedProduct._id, {
          name: editProduct.name,
          category: editProduct.category,
          price: Number.parseFloat(editProduct.price),
          stock: Number.parseFloat(editProduct.quantity),
          image: editProduct.image || undefined,
        })
        setProducts(
          products.map((p) =>
            p._id === selectedProduct._id
              ? {
                  ...p,
                  name: editProduct.name,
                  category: editProduct.category,
                  price: Number.parseFloat(editProduct.price),
                  stock: Number.parseFloat(editProduct.quantity),
                  image: editProduct.image || p.image,
                }
              : p,
          ),
        )
        setShowEditModal(false)
        setSelectedProduct(null)
        setEditImagePreview("")
      } catch (error) {
        console.error("Failed to update product:", error)
        alert("Failed to update product")
      }
    }
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (selectedProduct?._id) {
      try {
        await deleteProduct(selectedProduct._id)
        setProducts(products.filter((p) => p._id !== selectedProduct._id))
        setShowDeleteModal(false)
        setSelectedProduct(null)
      } catch (error) {
        console.error("Failed to delete product:", error)
        alert("Failed to delete product")
      }
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
        <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
          Add New Product
        </Button>
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{product.price}</td>
                  <td className="px-4 py-3 text-gray-600">{product.stock || 0} kg</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{product.rating || 0}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        (product.stock || 0) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {(product.stock || 0) > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      onClick={() => handleEditProduct(product)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteProduct(product)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 bg-transparent"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add New Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select category</option>
                  <option value="Grains">Grains</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage("add")}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-gray-50 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "add")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddProduct} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  Add Product
                </Button>
                <Button
                  onClick={() => {
                    setShowAddModal(false)
                    setImagePreview("")
                    setNewProduct({ name: "", category: "", price: "", quantity: "", description: "", image: "" })
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Product</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editProduct.category}
                  onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grains">Grains</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dairy">Dairy</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={editProduct.quantity}
                    onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                {editImagePreview ? (
                  <div className="relative">
                    <img
                      src={editImagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemoveImage("edit")}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-gray-50 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "edit")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
                <Button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditImagePreview("")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Product</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
              <Button onClick={() => setShowDeleteModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
