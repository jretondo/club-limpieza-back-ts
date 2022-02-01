import { NextFunction, Request, Response, Router } from 'express';
import { success } from '../../../network/response';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
const router = Router();

const responseSuccess = (req: Request, res: Response, next: NextFunction) => {
    success({ req, res });
}

//Routes
router.get("/dashboard", secure(), responseSuccess);
router.get("/changePass", secure(), responseSuccess);
router.get("/clientes", secure(EPermissions.clientes), responseSuccess);
router.get("/productos", secure(EPermissions.productos), responseSuccess);
router.get("/proveedores", secure(EPermissions.proveedores), responseSuccess);
router.get("/ptosVta", secure(EPermissions.ptosVta), responseSuccess);
router.get("/revendedores", secure(EPermissions.revendedores), responseSuccess);
router.get("/stock", secure(EPermissions.stock), responseSuccess);
router.get("/transportistas", secure(EPermissions.transportistas), responseSuccess);
router.get("/userAdmin", secure(EPermissions.userAdmin), responseSuccess);


export = router;