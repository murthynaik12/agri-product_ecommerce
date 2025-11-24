"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "@/lib/api-client"

interface Product {
  _id?: string
  name: string
  category: string
  price: number
  stock?: number
  quantity?: number
  rating?: number
  farmerName?: string
  farmerId?: string
  image?: string
}

export default function ProductsManagement() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setIsLoading(true)
      const data = await fetchProducts()
      const mappedProducts = data.map((p: any) => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        price: p.price,
        quantity: p.stock || 0,
        rating: p.rating || 0,
        farmerName: p.farmerName || "Unknown Farmer",
        farmerId: p.farmerId,
        stock: p.stock || 0,
      }))
      setProducts(mappedProducts)
    } catch (error) {
      console.error("Failed to load products:", error)
      alert("Failed to load products")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddClick = () => {
    setFormData({ name: "", category: "", price: "", quantity: "" })
    setShowAddModal(true)
  }

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      quantity: (product.quantity || 0).toString(),
    })
    setShowEditModal(true)
  }

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product)
    setShowDeleteModal(true)
  }

  const handleAddProduct = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
      alert("Please fill all fields")
      return
    }

    try {
      const newProduct = await createProduct({
        name: formData.name,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        stock: Number.parseFloat(formData.quantity),
        rating: 0,
        farmerName: "New Farmer",
      })
      setProducts([
        ...products,
        {
          _id: newProduct._id,
          name: newProduct.name,
          category: newProduct.category,
          price: newProduct.price,
          quantity: newProduct.stock,
          rating: 0,
          farmerName: "New Farmer",
        },
      ])
      setShowAddModal(false)
    } catch (error) {
      console.error("Failed to add product:", error)
      alert("Failed to add product")
    }
  }

  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.category || !formData.price || !formData.quantity) {
      alert("Please fill all fields")
      return
    }

    if (selectedProduct && selectedProduct._id) {
      try {
        await updateProduct(selectedProduct._id, {
          name: formData.name,
          category: formData.category,
          price: Number.parseFloat(formData.price),
          stock: Number.parseFloat(formData.quantity),
        })
        setProducts(
          products.map((p) =>
            p._id === selectedProduct._id
              ? {
                  ...p,
                  name: formData.name,
                  category: formData.category,
                  price: Number.parseFloat(formData.price),
                  quantity: Number.parseFloat(formData.quantity),
                }
              : p,
          ),
        )
        setShowEditModal(false)
      } catch (error) {
        console.error("Failed to update product:", error)
        alert("Failed to update product")
      }
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedProduct && selectedProduct._id) {
      try {
        await deleteProduct(selectedProduct._id)
        setProducts(products.filter((p) => p._id !== selectedProduct._id))
        setShowDeleteModal(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAddClick}>
          Add New Product
        </Button>
      </div>

      <Card className="p-6 bg-white border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Product Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Farmer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-600">{product.farmerName}</td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">₹{product.price}</td>
                  <td className="px-4 py-3 text-gray-600">{product.quantity} kg</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{product.rating || 0}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 bg-transparent"
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 bg-transparent"
                      onClick={() => handleDeleteClick(product)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Add New Product</h2>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium">Product Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Enter category"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <Input
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity (kg)</label>
                <Input
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black"
              >
                Cancel
              </Button>
              <Button onClick={handleAddProduct} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Add
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Edit Product</h2>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-sm font-medium">Product Name</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price (₹)</label>
                <Input value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Quantity (kg)</label>
                <Input
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black"
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateProduct} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                Update
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 bg-white max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Delete Product</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedProduct.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-black"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
