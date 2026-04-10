import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAllVisitors, createVisitor, updateVisitor, deleteVisitor } from './controllers/visitor.controller.js';
import { getAllUsers, createUser, updateUser, deleteUser, loginUser, getDashboardStats, getVisitorTrends, getVisitPurpose } from './controllers/user.controller.js';
import { getAllCampuses } from './controllers/campus.controller.js';

const app = new Hono();

// Enable CORS for Angular frontend
app.use('*', cors({
  origin: 'http://localhost:4200',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Test route
app.get('/', (c) => c.text('Hello Hono!'));

// Auth routes
app.post('/auth/login', loginUser);

// Visitor routes
app.get('/visitors', getAllVisitors);
app.post('/visitors', createVisitor);
app.put('/visitors/:id', updateVisitor);
app.delete('/visitors/:id', deleteVisitor);

// Campus routes
app.get('/campuses', getAllCampuses);

// User routes
app.get('/users', getAllUsers);
app.post('/users', createUser);
app.put('/users/:id', updateUser);
app.delete('/users/:id', deleteUser);

// Dashboard stats
app.get('/dashboard/stats', getDashboardStats);
app.get('/dashboard/visitor-trends', getVisitorTrends);
app.get('/dashboard/visit-purpose', getVisitPurpose);

// Start server
serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});