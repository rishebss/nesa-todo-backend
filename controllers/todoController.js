import Todo from '../models/Todo.js';
import { db } from '../config/firebase.js';

// Helper function to handle Firestore operations
const handleFirestoreError = (error) => {
  console.error('Firestore error:', error);
  
  if (error.code === 'permission-denied') {
    throw new Error('Permission denied. Check your Firebase rules.');
  } else if (error.code === 'not-found') {
    throw new Error('Resource not found.');
  } else if (error.code === 'already-exists') {
    throw new Error('Resource already exists.');
  } else {
    throw new Error(`Database error: ${error.message}`);
  }
};

// Create a new todo
export const createTodo = async (req, res) => {
  try {
    const { title, description, status, deadline } = req.body;
    
    // Create new Todo instance
    const todo = new Todo({
      title,
      description,
      status,
      deadline
    });
    
    // Add to Firestore
    const docRef = await db.collection('todos').add(todo.toFirestore());
    
    res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: {
        id: docRef.id,
        ...todo.toFirestore()
      }
    });
  } catch (error) {
    console.error('Create todo error:', error);
    
    if (error.message.startsWith('Validation failed:')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create todo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all todos with optional filters
export const getAllTodos = async (req, res) => {
  try {
    const { 
      status, 
      sortBy = 'createdAt', 
      order = 'desc',
      limit = 20,
      page = 1
    } = req.query;
    
    let query = db.collection('todos');
    
    // Filter by status
    if (status && ['pending', 'in-progress', 'completed'].includes(status)) {
      query = query.where('status', '==', status);
    }
    
    // Sort
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, sortOrder);
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    // Get total count
    const countSnapshot = await query.count().get();
    const total = countSnapshot.data().count;
    
    // Apply pagination
    query = query.limit(limitNum);
    if (offset > 0) {
      const lastDocSnapshot = await query.limit(offset).get();
      const lastDoc = lastDocSnapshot.docs[lastDocSnapshot.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }
    
    // Execute query
    const snapshot = await query.get();
    
    const todos = [];
    snapshot.forEach(doc => {
      todos.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Calculate deadlines
    const todosWithDeadlineStatus = todos.map(todo => {
      let deadlineStatus = 'none';
      if (todo.deadline) {
        const now = new Date();
        const deadline = new Date(todo.deadline);
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline < 0) {
          deadlineStatus = 'overdue';
        } else if (daysUntilDeadline === 0) {
          deadlineStatus = 'due-today';
        } else if (daysUntilDeadline <= 3) {
          deadlineStatus = 'due-soon';
        }
      }
      
      return {
        ...todo,
        deadlineStatus
      };
    });
    
    res.json({
      success: true,
      data: todosWithDeadlineStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get all todos error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch todos',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single todo by ID
export const getTodoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const doc = await db.collection('todos').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get todo by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch todo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update todo
export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Check if todo exists
    const todoRef = db.collection('todos').doc(id);
    const doc = await todoRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    // Create updated todo with validation
    const existingTodo = doc.data();
    const updatedTodo = new Todo({
      ...existingTodo,
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Update in Firestore
    await todoRef.update(updatedTodo.toFirestore());
    
    res.json({
      success: true,
      message: 'Todo updated successfully',
      data: {
        id,
        ...updatedTodo.toFirestore()
      }
    });
  } catch (error) {
    console.error('Update todo error:', error);
    
    if (error.message.startsWith('Validation failed:')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update todo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete todo
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const todoRef = db.collection('todos').doc(id);
    const doc = await todoRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    await todoRef.delete();
    
    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete todo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get todos statistics
export const getTodoStats = async (req, res) => {
  try {
    const snapshot = await db.collection('todos').get();
    
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;
    
    const now = new Date();
    
    snapshot.forEach(doc => {
      const todo = doc.data();
      total++;
      
      // Count by status
      if (todo.status === 'pending') pending++;
      if (todo.status === 'in-progress') inProgress++;
      if (todo.status === 'completed') completed++;
      
      // Check for overdue
      if (todo.deadline && new Date(todo.deadline) < now && todo.status !== 'completed') {
        overdue++;
      }
    });
    
    res.json({
      success: true,
      data: {
        total,
        pending,
        inProgress,
        completed,
        overdue,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Get todo stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};