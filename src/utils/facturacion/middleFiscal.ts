import ControllerInvoices from "../../api/components/invoices"
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
                let certDir = "drop_test.crt"
                let keyDir = "drop.key"
                let entornoAlt = false

                if (process.env.ENTORNO === "PROD") {
                    certDir = pvData.cert_file || "drop_test.crt"
                    keyDir = pvData.key_file || "drop.key"
                    entornoAlt = true
                }

                const afip = new AfipClass(newFact.cuit_origen, certDir, keyDir, entornoAlt);
                const newDataFiscal = await afip.newFact(dataFiscal);
                req.body.dataFiscal = newDataFiscal.data
                req.body.dataFiscal.CbteTipo = newFact.t_fact
                req.body.newFact.cbte = req.body.dataFiscal.CbteDesde
                next()
            } else {
                const lastInvoice = await ControllerInvoices.lastInvoice(pvData.id || 0, false, 0, false)
                newFact.cbte
                req.body.newFact.cbte = lastInvoice.lastInvoice + 1
                next()
            }
        } catch (error) {
            console.error(error)
            next(new Error("Faltan datos o hay datos erroneos, controlelo!"))
        }
    }
    return middleware
}