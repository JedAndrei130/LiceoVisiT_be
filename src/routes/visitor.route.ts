import { Hono } from "hono";
import { getAllVisitors, createVisitor, deleteVisitor } from "../controllers/visitor.controller.js";

const visitorRoute = new Hono();

visitorRoute.get('/', getAllVisitors);
visitorRoute.post('/', createVisitor);
visitorRoute.delete('/:id', deleteVisitor);

export default visitorRoute;