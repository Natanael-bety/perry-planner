import { Router } from "express";
import { ClienteEmpresaController } from "./cliente-empresa.controller";
import { auth } from "../../middlewares/auth";

const clienteEmpresaController = new ClienteEmpresaController();
const clienteEmpresaRouter = Router();

clienteEmpresaRouter.post("/clientes", auth, clienteEmpresaController.create);
clienteEmpresaRouter.get("/clientes/:empresaId", auth, clienteEmpresaController.getAllByCompanyId);
clienteEmpresaRouter.delete("/clientes/:empresaId", auth, clienteEmpresaController.deleteByCompanyId);

export { clienteEmpresaRouter };
