export {};

// * Union and literal types
type Status = 'pending' | 'approved' | 'rejected';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type UserRole = 'employee' | 'manager' | 'admin';

// ? Conditional types (like if-statements for types)
type NonNullable<T> = T extends null | undefined ? never : T;
type ApiResponse<T> = T extends string ? { message: T } : { data: T };

// * Advanced result pattern
type Result<T, E = Error> =
  | { success: true; data: T; message?: string }
  | { success: false; error: E; code?: number };

// ? Mapped types (transform existing types)
type MakeOptional<T> = {
  [P in keyof T]?: T[P];
};

type MakeReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// * Specific mapped types
type CreateRequest<T extends BaseEntity> = Omit<T, keyof BaseEntity | keyof Auditable>;
type UpdateRequest<T> = MakeOptional<Omit<T, 'id' | 'createdAt' | 'version'>>;

// ? Template literal types (string manipulation at type level)
type EventName<T extends string> = `on${Capitalize<T>}`;
type ApiEndpoint<T extends string> = `/api/v1/${T}`;

// -------------------
// Generic Interfaces with Constraints
// -------------------

interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

interface Auditable {
  createdBy: string;
  updatedBy: string;
}

// ? Generic repository pattern (T must extend BaseEntity)
interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: MakeOptional<T>): Promise<T[]>;
  create(entity: Omit<T, keyof BaseEntity>): Promise<T>;
  update(id: string, updates: MakeOptional<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// -------------------
// Advanced Error Handling
// -------------------

// * Custom error hierarchy
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly isOperational = true;
}

class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly isOperational = true;
}

const createResult = {
  success: <T>(data: T): Result<T> => ({ success: true, data }),
  failure: <T, E = Error>(error: E): Result<T, E> => ({ success: false, error }),
};

// -------------------
// Advanced Patterns: Builder Pattern
// -------------------

interface Task extends BaseEntity, Auditable {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assigneeId: string;
  dueDate?: Date;
  tags: string[];
}

interface User extends BaseEntity, Auditable {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

type UserCreateRequest = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

type TaskCreateRequest = {
  title: string;
  description: string;
  priority: Priority;
  assigneeId: string;
  dueDate?: Date;
  tags?: string[];
};

// -------------------
// Validation Utilities
// -------------------

class ValidationService {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUser(userData: UserCreateRequest): Result<void, ValidationError> {
    if (!this.isValidEmail(userData.email)) {
      return { success: false, error: new ValidationError('Invalid email format') };
    }

    if (!userData.firstName.trim() || !userData.lastName.trim()) {
      return { success: false, error: new ValidationError('First name and last name are required') };
    }

    return { success: true, data: undefined };
  }

  static validateTask(taskData: TaskCreateRequest): Result<void, ValidationError> {
    if (!taskData.title.trim()) {
      return { success: false, error: new ValidationError('Task title is required') };
    }

    if (taskData.title.length > 200) {
      return { success: false, error: new ValidationError('Task title must be less than 200 characters') };
    }

    return { success: true, data: undefined };
  }
}

class TaskBuilder {
  private task: MakeOptional<Task> = {};

  setTitle(title: string): TaskBuilder {
    this.task.title = title;
    return this;
  }

  setDescription(description: string): TaskBuilder {
    this.task.description = description;
    return this;
  }

  setPriority(priority: Priority): TaskBuilder {
    this.task.priority = priority;
    return this;
  }

  setDueDate(dueDate: Date): TaskBuilder {
    this.task.dueDate = dueDate;
    return this;
  }

  setAssignee(assignee: string): TaskBuilder {
    this.task.assigneeId = assignee;
    return this;
  }

  addTag(tag: string): TaskBuilder {
    if (!this.task.tags) this.task.tags = [];
    this.task.tags.push(tag);
    return this;
  }

  build(): Task {
    if (!this.task.title) {
      throw new ValidationError('Task title is required');
    }

    const now = new Date();
    return {
      id: crypto.randomUUID?.() || Math.random().toString(36),
      title: this.task.title,
      description: this.task.description || '',
      status: this.task.status || 'pending',
      priority: this.task.priority || 'medium',
      assigneeId: this.task.assigneeId || '',
      dueDate: this.task.dueDate,
      tags: this.task.tags || [],
      createdAt: now,
      updatedAt: now,
      version: 1,
      createdBy: 'system',
      updatedBy: 'system',
    };
  }
}

// -------------------
// Repository Implementation
// -------------------

class TaskRepository implements Repository<Task> {
  private tasks: Map<string, Task> = new Map();

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findAll(filter?: MakeOptional<Task>): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      tasks = tasks.filter((task) => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined) return true;
          return task[key as keyof Task] === value;
        });
      });
    }
    return tasks;
  }

  async create(taskData: Omit<Task, keyof BaseEntity>): Promise<Task> {
    const now = new Date();
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID?.() || Math.random().toString(36),
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  async update(id: string, updates: MakeOptional<Task>): Promise<Task> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      updatedAt: new Date(),
      version: existingTask.version + 1,
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async delete(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async findByStatus(status: Status): Promise<Task[]> {
    return this.findAll({ status });
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return this.findAll({ assigneeId });
  }
}

// -------------------
// Service Layer with Dependency Injection
// -------------------

class TaskService {
  constructor(private taskRepository: TaskRepository) {}

  async createTask(taskData: Omit<Task, keyof BaseEntity | keyof Auditable>): Promise<Result<Task>> {
    try {
      if (!taskData.title?.trim()) {
        return createResult.failure(new ValidationError('Task title is required'));
      }

      const task = await this.taskRepository.create({
        ...taskData,
        createdBy: 'current-user-id',
        updatedBy: 'current-user-id',
        tags: taskData.tags || [],
      });

      return createResult.success(task);
    } catch (error) {
      return createResult.failure(error as Error);
    }
  }

  async updateTaskStatus(taskId: string, newStatus: Status): Promise<Result<Task>> {
    try {
      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return createResult.failure(new NotFoundError(`Task with ID ${taskId} not found`));
      }

      const updatedTask = await this.taskRepository.update(taskId, {
        status: newStatus,
        updatedBy: 'current-user-id',
      });

      return createResult.success(updatedTask);
    } catch (error) {
      return createResult.failure(error as Error);
    }
  }

  async getTaskMetrics(): Promise<{
    total: number;
    byStatus: Record<Status, number>;
    byPriority: Record<Priority, number>;
  }> {
    const allTasks = await this.taskRepository.findAll();

    const byStatus = allTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<Status, number>);

    const byPriority = allTasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<Priority, number>);

    return {
      total: allTasks.length,
      byStatus,
      byPriority,
    };
  }
}

// -------------------
// User Management Service
// -------------------

class UserService {
  constructor(private userRepository: Repository<User>) {}

  async createUser(userData: UserCreateRequest): Promise<Result<User, ValidationError | Error>> {
    const validation = ValidationService.validateUser(userData);
    if (!validation.success) {
      return validation;
    }

    try {
      const existingUsers = await this.userRepository.findAll({ email: userData.email });
      if (existingUsers.length > 0) {
        return {
          success: false,
          error: new ValidationError('Email already exists'),
          code: 409,
        };
      }

      const user = await this.userRepository.create({
        ...userData,
        isActive: true,
        createdBy: 'system',
        updatedBy: 'system',
      });

      return createResult.success(user);
    } catch (error) {
      return createResult.failure(error as Error);
    }
  }

  async deactivateUser(userId: string, performedBy: string): Promise<Result<User>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return createResult.failure(new NotFoundError(`User with ID ${userId} not found`));
      }

      const updatedUser = await this.userRepository.update(userId, {
        isActive: false,
        updatedBy: performedBy,
      });

      return createResult.success(updatedUser);
    } catch (error) {
      return createResult.failure(error as Error);
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.findAll({ role, isActive: true });
  }
}

// -------------------
// Functional Programming Utilities
// -------------------

const pipe =
  <T>(...fns: Array<(arg: T) => T>) =>
  (value: T): T =>
    fns.reduce((acc, fn) => fn(acc), value);

const add =
  (a: number) =>
  (b: number): number =>
    a + b;
const multiply =
  (a: number) =>
  (b: number): number =>
    a * b;

// * Memoization for performance
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// -------------------
// Advanced Type Usage Examples
// -------------------

// * Template literal types in action
type UserEvent = EventName<'click' | 'hover' | 'focus'>;
const eventHandlers: Record<UserEvent, () => void> = {
  onClick: () => console.log('Clicked'),
  onHover: () => console.log('Hovered'),
  onFocus: () => console.log('Focused'),
};

// * API endpoint types
type Endpoints = ApiEndpoint<'users' | 'tasks' | 'projects'>;
const endpoints: Record<string, Endpoints> = {
  users: '/api/v1/users',
  tasks: '/api/v1/tasks',
  projects: '/api/v1/projects',
};

// -------------------
// PRACTICAL DEMONSTRATION
// -------------------

async function demonstrateAdvancedFeatures(): Promise<void> {
  console.log('\n=== ADVANCED TYPESCRIPT FEATURES ===\n');

  console.log('1. User Management with Validation:');
  const userRepository = new TaskRepository() as any;
  const userService = new UserService(userRepository);

  const userResult = await userService.createUser({
    email: 'developer@company.com',
    firstName: 'John',
    lastName: 'Developer',
    role: 'employee',
  });

  if (userResult.success) {
    console.log('✅ User created:', `${userResult.data.firstName} ${userResult.data.lastName}`);
    console.log('   Email:', userResult.data.email);
    console.log('   Role:', userResult.data.role);
  } else {
    console.log('❌ User creation failed:', userResult.error.message);
  }

  console.log('\n2. Builder Pattern:');
  const task = new TaskBuilder()
    .setTitle('Implement advanced TypeScript features')
    .setDescription('Create comprehensive examples')
    .setPriority('high')
    .setDueDate(new Date('2025-09-01'))
    .addTag('typescript')
    .addTag('advanced')
    .build();

  console.log('✅ Built task:', task.title);

  console.log('\n3. Repository & Service Layer:');
  const taskRepository = new TaskRepository();
  const taskService = new TaskService(taskRepository);

  const createResult = await taskService.createTask({
    title: 'Advanced TypeScript Task',
    description: 'Demonstrate complex concepts',
    status: 'pending',
    priority: 'high',
    assigneeId: 'dev-123',
    tags: ['typescript', 'advanced'],
  });

  if (createResult.success) {
    console.log('✅ Task created:', createResult.data.title);

    const updateResult = await taskService.updateTaskStatus(createResult.data.id, 'approved');
    if (updateResult.success) {
      console.log('✅ Status updated:', updateResult.data.status);
    }
  } else {
    console.log('❌ Failed:', createResult.error.message);
  }

  console.log('\n4. Business Metrics:');
  const metrics = await taskService.getTaskMetrics();
  console.log('-> Task metrics:', {
    total: metrics.total,
    byStatus: metrics.byStatus,
    byPriority: metrics.byPriority,
  });

  console.log('\n5. Functional Programming:');
  const addFive = add(5);
  const multiplyByTwo = multiply(2);
  const transform = pipe(addFive, multiplyByTwo);
  console.log('-> Pipe result (5 + 5) * 2:', transform(5));

  console.log('\n6. Performance Optimization:');
  const fibonacci = memoize((n: number): number => {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  });

  console.time('Fibonacci');
  console.log('Fibonacci(40):', fibonacci(40));
  console.timeEnd('Fibonacci');

  console.log('\n7. Advanced Type System:');
  console.log('Event handlers:', Object.keys(eventHandlers));
  console.log('API endpoints:', Object.values(endpoints));

  console.log('\n8. Type Transformations:');
  type OptionalTask = MakeOptional<Task>;
  type ReadonlyTask = MakeReadonly<Task>;
  console.log('✅ Type transformations applied successfully');

  console.log('\n=== DEMONSTRATION COMPLETE ===\n');
}

// Run the demonstration
demonstrateAdvancedFeatures().catch(console.error);
