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
    Controller.list(undefined, req.body.query)
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

const listPagination = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.list(
        Number(req.params.page),
        String(req.query.search),
        Number(req.query.cantPerPage)
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
    Controller.upsert(req.body, next)
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
        .then((status) => {
            success({ req, res, status: status });
        })
        .catch(next)
}

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get(Number(req.params.id))
        .then((data) => {
            success({ req, res, message: data })
        })
        .catch(next)
}

const dataFiscalPadron = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.dataFiscalPadron(Number(req.query.cuit), String(req.query.cert), String(req.query.key), Number(req.query.cuitPv))
        .then((data) => {
            success({ req, res, message: data })
        })
        .catch(next)
}

const listCtaCteClient = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.listCtaCteClient(
        Number(req.query.idCliente),
        Boolean(req.query.debit),
        Boolean(req.query.credit),
        Number(req.params.page)).then((lista) => {
            success({
                req,
                res,
                status: 200,
                message: lista
            });
        }).catch(next)
};

router
    .get("/dataFiscal", secure(EPermissions.clientes), dataFiscalPadron)
    .get("/ctaCte/:page", secure(EPermissions.clientes), listCtaCteClient)
    .get("/details/:id", secure(EPermissions.clientes), get)
    .get("/:page", secure(EPermissions.clientes), listPagination)
    .delete("/:id", secure(EPermissions.clientes), remove)
    .get("/", secure(EPermissions.clientes), list)
    .post("/", secure(EPermissions.clientes), upsert)
    .put("/", secure(EPermissions.clientes), upsert)

export = router;