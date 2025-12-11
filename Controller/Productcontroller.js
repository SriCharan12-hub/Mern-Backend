import Product from "../Model/Productmodel.js";

export const addProduct = async (req, res) => {
    try {
        const {
            title,
            price,
            category,
            image,
            images,
            count,
            description,
        } = req.body;

        if (!title || !price || !category || !count || !description) {
            return res.status(400).json({ message: "Please provide all product details (title, price, category, count, description)." });
        }

        if (title.trim().length<4 || title.trim().length>100){
            return res.status(400).json({ message: "length of title should be btw 4-100" });

        }
        if (description.trim().length<10 || description.trim().length>1000){
            return res.status(400).json({ message: "length of description should be btw 10-100" });

        }
         if (!image && (!images || images.length === 0)) {
            return res.status(400).json({ 
                message: 'Please upload at least one image' 
            });
            }
        if (price <= 0) {
            return res.status(400).json({ message: "Price should be greater than 0" });
        }
        if (count <= 0) {
            return res.status(400).json({ message: "Count should be greater than 0" });
        }

        // Find the product with the highest 'id' to get the next available ID
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const nextId = lastProduct ? lastProduct.id + 1 : 1;

        const newProduct = new Product({
            id: nextId, // Assign the new, unique ID
            title,
            price: price,
            category,
            image: image || (images && images[0]), // First image as main
            images: images || [image], // Array of images
            count,
            description,
        });

        const savedProduct = await newProduct.save();

        res.status(201).json({
            message: "Product added successfully",
            product: savedProduct,
        });
    } catch (error) {
        // This will now catch other errors, but the duplicate key error should be fixed.
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    
    // Debug log (remove after testing)
    if (products.length > 0) {
      console.log("Sample product images:", {
        id: products[0].id,
        image: products[0].image,
        images: products[0].images,
        imagesCount: products[0].images?.length
      });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      message: 'Failed to fetch products',
      error: error.message 
    });
  }
};


export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params; 
        const updatedData = req.body;
        // Try to update by Mongo _id first (common), otherwise fall back to numeric `id` field
        let updatedProduct = null;
        if (id && id.match && id.match(/^[0-9a-fA-F]{24}$/)) {
            updatedProduct = await Product.findByIdAndUpdate(id, updatedData, { new: true });
        }
        if (!updatedProduct) {
            updatedProduct = await Product.findOneAndUpdate({ id: Number(id) }, updatedData, { new: true });
        }

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json({
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params; 
        let deletedProduct = null;
        if (id && id.match && id.match(/^[0-9a-fA-F]{24}$/)) {
            deletedProduct = await Product.findByIdAndDelete(id);
        }
        if (!deletedProduct) {
            deletedProduct = await Product.findOneAndDelete({ id: Number(id) });
        }

        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found." });
        }

        res.status(200).json({
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};