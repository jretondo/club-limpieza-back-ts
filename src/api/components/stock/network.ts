import { Router, NextFunction, Response, Request } from 'express';
import { success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';

const list = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.query.idPv),
        Number(req.query.idProd)
    )
        .then((lista: any) => {
            success({
                req,
                res,
                status: 200,
                message: lista
            });
        })
        .catch(next)
};

const ultMov = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.ultimosMovStock(
        Number(req.query.idPv),
        Number(req.query.idProd)
    )
        .then((lista: any) => {
            success({
                req,
                res,
                status: 200,
                message: lista
            });
        })
        .catch(next)
};

const upsert = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.upsert(req.body, req.body.user)
        .then(response => {
            if (response) {
                success({
                    req,
                    res
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}

const moverStock = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.moverStock(req.body, req.body.user)
        .then(response => {
            if (response) {
                success({
                    req,
                    res
                });
            } else {
                next(response);
            }
        })
        .catch(next)
}

const remove = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.remove(Number(req.params.id))
        .then(() => {
            success({ req, res });
        })
        .catch(next)
}

router.get("/", secure(EPermissions.ventas), list);
router.get("/ultMov/", secure(EPermissions.ventas), ultMov);
router.post("/", secure(EPermissions.ventas), upsert);
router.post("/moverStock", secure(EPermissions.ventas), moverStock);
router.delete("/:id", secure(EPermissions.ventas), remove);

export = router;