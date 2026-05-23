const Category = require('../models/category');

// Admin: List all categories
const adminCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    
    res.render('admin/categories/list', {
      title: 'Manage Categories',
      categories,
      activePage: 'categories',
      error: req.session.error,
      success: req.session.success
    });
    
    req.session.error = null;
    req.session.success = null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    req.session.error = 'Failed to load categories';
    res.redirect('/admin/dashboard');
  }
};

// Admin: Show create category form
const createCategoryForm = (req, res) => {
  res.render('admin/categories/create', {
    title: 'Create Category',
    activePage: 'categories',
    error: req.session.error,
    formData: req.session.formData
  });
  req.session.error = null;
  req.session.formData = null;
};

// Admin: Create category
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      req.session.error = 'Category name is required';
      req.session.formData = req.body;
      return res.redirect('/admin/categories/create');
    }
    
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      req.session.error = 'Category already exists';
      req.session.formData = req.body;
      return res.redirect('/admin/categories/create');
    }
    
    const category = new Category({ name, description });
    await category.save();
    
    req.session.success = 'Category created successfully';
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error creating category:', error);
    req.session.error = 'Failed to create category';
    req.session.formData = req.body;
    res.redirect('/admin/categories/create');
  }
};

// Admin: Show edit category form
const editCategoryForm = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      req.session.error = 'Category not found';
      return res.redirect('/admin/categories');
    }
    
    res.render('admin/categories/edit', {
      title: 'Edit Category',
      category,
      activePage: 'categories',
      error: req.session.error,
      formData: req.session.formData || category
    });
    req.session.error = null;
    req.session.formData = null;
  } catch (error) {
    console.error('Error loading category:', error);
    req.session.error = 'Failed to load category';
    res.redirect('/admin/categories');
  }
};

// Admin: Update category
const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    if (!name) {
      req.session.error = 'Category name is required';
      return res.redirect(`/admin/categories/edit/${req.params.id}`);
    }
    
    await Category.findByIdAndUpdate(req.params.id, {
      name,
      description,
      isActive: isActive === 'on'
    });
    
    req.session.success = 'Category updated successfully';
    res.redirect('/admin/categories');
  } catch (error) {
    console.error('Error updating category:', error);
    req.session.error = 'Failed to update category';
    res.redirect(`/admin/categories/edit/${req.params.id}`);
  }
};

// Admin: Delete category
const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    req.session.success = 'Category deleted successfully';
  } catch (error) {
    console.error('Error deleting category:', error);
    req.session.error = 'Failed to delete category';
  }
  res.redirect('/admin/categories');
};

module.exports = {
  adminCategories,
  createCategoryForm,
  createCategory,
  editCategoryForm,
  updateCategory,
  deleteCategory
};