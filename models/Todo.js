// Todo model - defines the structure and validation for todos

class Todo {
  constructor({
    title,
    description = '',
    status = 'pending',
    deadline = null,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.title = title;
    this.description = description;
    this.status = status;
    this.deadline = deadline;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    
    // Validate the todo
    this.validate();
  }

  validate() {
    const errors = [];
    
    // Title validation
    if (!this.title || this.title.trim() === '') {
      errors.push('Title is required');
    } else if (this.title.length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }
    
    // Description validation
    if (this.description && this.description.length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }
    
    // Status validation
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(this.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Deadline validation
    if (this.deadline) {
      const deadlineDate = new Date(this.deadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push('Invalid deadline date format');
      } else if (deadlineDate < new Date()) {
        errors.push('Deadline cannot be in the past');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // Trim and sanitize fields
    this.title = this.title.trim();
    if (this.description) {
      this.description = this.description.trim();
    }
  }

  // Convert to Firestore document format
  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      status: this.status,
      deadline: this.deadline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new Todo({
      ...data,
      id: doc.id
    });
  }
}

export default Todo;