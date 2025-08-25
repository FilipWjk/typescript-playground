export {};

// -------------------
// Enums
// -------------------

enum Role {
  Employee = 'Employee',
  Manager = 'Manager',
  Admin = 'Admin',
}

// -------------------
// Types & Interfaces
// -------------------

type ID = number | string;

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

type ApiResult<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code: number };

interface Person {
  id: ID;
  name: string;
  age: number;
  email?: string;
}

interface Employee extends Person {
  role: Role;
  department: string;
  salary: number;
}

interface Task {
  id: ID;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignedTo: ID;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------
// Classes & OOP
// -------------------

class Manager implements Employee {
  readonly id: ID;

  public name: string;
  public age: number;
  public department: string;
  public salary: number;
  public role: Role;
  public email?: string;

  private team: Employee[] = [];
  public teamNames: string[] = [];
  private hireDate: Date;

  constructor(id: ID, name: string, age: number, department: string, salary: number, email?: string) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.department = department;
    this.salary = salary;
    this.role = Role.Manager;
    this.hireDate = new Date();
    if (email) this.email = email;
  }

  addTeamMember(emp: Employee) {
    this.team.push(emp);
    this.teamNames.push(emp.name);
  }

  printSummary() {
    console.log(`\n ${this.name} (${this.role}) manages ${this.team.length} people in ${this.department}`);
  }

  getTeamDetails(): { name: string; role: Role; department: string }[] {
    return this.team.map((emp) => ({
      name: emp.name,
      role: emp.role,
      department: emp.department,
    }));
  }

  printTeamDetails() {
    console.log(`\n Team members under ${this.name}:`);
    this.team.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.name} (${emp.role}) - ${emp.department}`);
    });
  }

  // * Getter for hireDate
  getHireDate(): string {
    return this.hireDate.toDateString();
  }

  // * Setter for hireDate
  setHireDate(date: Date) {
    this.hireDate = date;
  }
}

// -------------------
// Abstract Classes & Inheritance
// -------------------

abstract class Vehicle {
  constructor(public make: string, public model: string, public year: number) {}

  abstract move(): void;

  info(): string {
    return `${this.year} ${this.make} ${this.model}`;
  }
}

class Car extends Vehicle {
  move() {
    console.log(`\n${this.info()} drives smoothly on the road.`);
  }
}

class Bike extends Vehicle {
  move() {
    console.log(`\n${this.info()} pedals along the path.`);
  }
}

// -------------------
// Functions
// -------------------

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// * Regular function
function calculateBonus(salary: number, percentage: number = 10): number {
  return salary * (percentage / 100);
}

// * Arrow function
const greet = (person: Person): string => `\nHello, ${person.name}! (${person.age} years old)`;

function getVehicleInfo(vehicle: Vehicle): string {
  return vehicle.info();
}

function createTaskSafely(taskData: {
  title: string;
  description: string;
  priority: Priority;
  assignedTo: ID;
}): ApiResult<Task> {
  if (!taskData.title.trim()) {
    return {
      success: false,
      error: 'Task title is required',
      code: 400,
    };
  }

  const now = new Date();
  const task: Task = {
    id: generateId(),
    title: taskData.title,
    description: taskData.description,
    status: 'todo',
    priority: taskData.priority,
    assignedTo: taskData.assignedTo,
    createdAt: now,
    updatedAt: now,
  };

  return {
    success: true,
    data: task,
    message: 'Task created successfully',
  };
}

// -------------------
// Generics
// -------------------
function identity<T>(value: T): T {
  return value;
}

class Repository<T extends { id: ID }> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: ID): T | undefined {
    return this.items.find((i) => i.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }
}

// -------------------
// Usage Examples
// -------------------

const alice: Employee = {
  id: 1,
  name: 'Alice',
  age: 28,
  role: Role.Employee,
  department: 'Engineering',
  salary: 85000,
};

const bob = new Manager(2, 'Bob', 40, 'Engineering', 120000, 'bob@company.com');
bob.addTeamMember(alice);
bob.printSummary();
bob.printTeamDetails();
console.log('\nBob was hired on:', bob.getHireDate());

// * Vehicles
const car = new Car('Toyota', 'Corolla', 2021);
const bike = new Bike('Giant', 'Escape 3', 2020);
car.move();
bike.move();

// * Functions
console.log('\nBonus for Alice:', calculateBonus(alice.salary));
console.log(greet(alice));
console.log('\nCar info:', getVehicleInfo(car));

const taskResult = createTaskSafely({
  title: 'Review TypeScript code',
  description: 'Check TypeScript examples',
  priority: 'high',
  assignedTo: alice.id,
});

if (taskResult.success) {
  console.log('\n✅ Task created:', taskResult.data.title);
  console.log('   Assigned to:', alice.name);
  console.log('   Created on:', formatDate(taskResult.data.createdAt));
  console.log('   Priority:', taskResult.data.priority);
} else {
  console.log('❌ Task creation failed:', taskResult.error);
}

console.log('\nEmail validation examples:');
console.log('Valid email:', isValidEmail('alice@company.com'));
console.log('Invalid email:', isValidEmail('not-an-email'));

console.log('\nGenerated IDs:');
console.log('ID 1:', generateId());
console.log('ID 2:', generateId());

// * Generics
console.log('\nIdentity number:', identity(123));
console.log('Identity string:', identity('typescript'));

const employeeRepo = new Repository<Employee>();
employeeRepo.add(alice);
employeeRepo.add(bob);
console.log('\nFind by ID:', employeeRepo.findById(1));
console.log('\nAll employees:', employeeRepo.getAll());
