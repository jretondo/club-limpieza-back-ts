import { NextFunction, Request, Response } from "express"
import { INewPV } from "interfaces/Irequests"
import { IFactura } from "interfaces/Itables"
import { AfipClass } from "./AfipClass"

export const fiscalMiddle = () => {
    const middleware = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const pvData: INewPV = req.body.pvData
            const newFact: IFactura = req.body.newFact
            const dataFiscal: FactInscriptoProd |
                FactInscriptoProdNC |
                FactInscriptoServ |
                FactInscriptoServNC |
                FactMonotribProd |
                FactMonotribProdNC |
                FactMonotribServ |
                FactMonotribServNC |
                any = req.body.dataFiscal

            if (newFact.fiscal) {
                const afip = new AfipClass(newFact.cuit_origen, pvData.cert_file || "drop_test.crt", pvData.key_file || "drop_test.key", req.body.entorno);
                const newDataFiscal = await afip.newFact(dataFiscal);
                req.body.dataFiscal = newDataFiscal.data
                req.body.dataFiscal.CbteTipo = newFact.t_fact
                req.body.newFact.cbte = req.body.dataFiscal.CbteDesde
                next()
            } else {
                next()
            }
        } catch (error) {
            console.error(error)
            next(new Error("Faltan datos o hay datos erroneos, controlelo!"))
        }
    }
    return middleware
}