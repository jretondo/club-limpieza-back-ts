import { Router, NextFunction, Response, Request } from 'express';
import { file, success } from '../../../network/response';
const router = Router();
import Controller from './index';
import secure from '../../../auth/secure';
import { EPermissions } from '../../../enums/EfunctMysql';
import factuMiddel from '../../../utils/facturacion/middleFactu';
import { fiscalMiddle } from '../../../utils/facturacion/middleFiscal';
import { invoicePDFMiddle } from '../../../utils/facturacion/middlePDFinvoice';
import { sendFactMiddle } from '../../../utils/facturacion/middleSendFact';

const list = (
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

const cajaList = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.cajaList(
        Number(req.query.userId),
        Number(req.query.ptoVta),
        String(req.query.desde),
        String(req.query.hasta),
        Number(req.params.page),
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
};

const get = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.get(Number(req.params.id))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

const getLast = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.lastInvoice(Number(req.query.pvId), Boolean(req.query.fiscal), Number(req.query.tipo), Boolean(req.query.entorno))
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

const newInvoice = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.newInvoice(req.body.pvData, req.body.newFact, req.body.dataFiscal, req.body.productsList, req.body.fileName, req.body.filePath)
        .then((dataFact) => {
            file(req, res, dataFact.filePath, 'application/pdf', dataFact.fileName, dataFact);
        })
        .catch(next)
};

const getFiscalDataInvoice = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    Controller.getFiscalDataInvoice(
        Number(req.query.ncbte),
        Number(req.query.pvId),
        Boolean(req.query.fiscal),
        Number(req.query.tipo),
        Boolean(req.query.entorno)
    )
        .then((data) => {
            success({ req, res, message: data });
        })
        .catch(next)
};

router.get("/details/:id", secure(EPermissions.ventas), get);
router.get("/cajaList/:page", secure(EPermissions.ventas), cajaList)
router.get("/last", secure(EPermissions.ventas), getLast);
router.get("/afipData", secure(EPermissions.ventas), getFiscalDataInvoice);
router.get("/:page", secure(EPermissions.ventas), list);

router.post("/", secure(EPermissions.ventas), factuMiddel(), fiscalMiddle(), invoicePDFMiddle(), sendFactMiddle(), newInvoice);

router.delete("/:id", secure(EPermissions.ventas), remove);

export = router;