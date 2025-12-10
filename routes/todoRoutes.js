import express from 'express';
import {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
  getTodoStats
} from '../controllers/todoController.js';

const router = express.Router();

// Create a new todo
router.post('/', createTodo);

// Get all todos with filters
router.get('/', getAllTodos);

// Get todo statistics
router.get('/stats', getTodoStats);

// Get single todo by ID
router.get('/:id', getTodoById);

// Update todo
router.put('/:id', updateTodo);

// Delete todo
router.delete('/:id', deleteTodo);

export default router;