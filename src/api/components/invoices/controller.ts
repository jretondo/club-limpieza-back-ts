
import { EConcatWhere, EModeWhere, ESelectFunct } from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';
import getPages from '../../../utils/getPages';
import {
    AfipClass,
    CbteTipos
} from '../../../utils/facturacion/AfipClass'
import ptosVtaController from '../ptosVta';
import { Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { IDetFactura, IFactura, IUser } from 'interfaces/Itables';
import { INewFactura, INewPV } from 'interfaces/Irequests';
import fs from 'fs';
import { multipleInsert } from '../../../store/mysql/functions';
import moment from 'moment';

export = (injectedStore: typeof StoreType) => {
    let store = injectedStore;

    const list = async (page?: number, item?: string, cantPerPage?: number) => {

        let filter: IWhereParams | undefined = undefined;
        let filters: Array<IWhereParams> = [];
        if (item) {
            filter = {
                mode: EModeWhere.like,
                concat: EConcatWhere.or,
                items: [
                    { column: Columns.facturas.cae, object: String(item) },
                    { column: Columns.facturas.n_doc_cliente, object: String(item) },
                    { column: Columns.facturas.fecha, object: String(item) },
                    { column: Columns.facturas.cbte, object: String(item) },
                    { column: Columns.facturas.pv, object: String(item) },
                    { column: Columns.facturas.raz_soc_cliente, object: String(item) }
                ]
            };
            filters.push(filter);
        }

        let pages: Ipages;
        if (page) {
            pages = {
                currentPage: page,
                cantPerPage: cantPerPage || 10,
                order: Columns.facturas.id,
                asc: true
            };
            const data = await store.list(Tables.FACTURAS, [ESelectFunct.all], filters, undefined, pages);
            const cant = await store.list(Tables.FACTURAS, [`COUNT(${ESelectFunct.all}) AS COUNT`], filters, undefined, undefined);
            const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
            return {
                data,
                pagesObj
            };
        } else {
            const data = await store.list(Tables.FACTURAS, [ESelectFunct.all], filters, undefined, undefined);
            return {
                data
            };
        }
    }

    const get = async (id: number) => {
        return await store.get(Tables.FACTURAS, id);
    }

    const remove = async (id: number) => {
        return await store.remove(Tables.FACTURAS, { id });
    }

    const insertFact = async (
        newFact: IFactura,
        newDetFact: Array<IDetFactura>,
        factFiscal: FactInscriptoProd |
            FactInscriptoProdNC |
            FactInscriptoServ |
            FactInscriptoServNC |
            FactMonotribProd |
            FactMonotribProdNC |
            FactMonotribServ |
            FactMonotribServNC) => {

        if (newFact.fiscal) {
            newFact.cae = factFiscal.CAE
            newFact.vto_cae = new Date(factFiscal.CAEFchVto || "") || new Date()
        }

        const result = await store.insert(Tables.FACTURAS, newFact);
        if (result.affectedRows > 0) {
            const factId = result.insertId
            const headers: Array<string> = [
                Columns.detallesFact.fact_id,
                Columns.detallesFact.id_prod,
                Columns.detallesFact.nombre_prod,
                Columns.detallesFact.cant_prod,
                Columns.detallesFact.unidad_tipo_prod,
                Columns.detallesFact.total_prod,
                Columns.detallesFact.total_iva,
                Columns.detallesFact.total_costo,
                Columns.detallesFact.total_neto,
                Columns.detallesFact.alicuota_id,
                Columns.detallesFact.precio_ind
            ]
            const rows: Promise<Array<Array<any>>> = new Promise((resolve, reject) => {
                const rowsvalues: Array<Array<any>> = []
                newDetFact.map((item, key) => {
                    const values = []
                    values.push(factId)
                    values.push(item.id_prod)
                    values.push(item.nombre_prod)
                    values.push(item.cant_prod)
                    values.push(item.unidad_tipo_prod)
                    values.push(item.total_prod)
                    values.push(item.total_iva)
                    values.push(item.total_costo)
                    values.push(item.total_neto)
                    values.push(item.alicuota_id)
                    values.push(item.precio_ind)
                    rowsvalues.push(values)
                    if (key === newDetFact.length - 1) {
                        resolve(rowsvalues)
                    }
                })
            })
            const resultinsert = store.mInsert(Tables.DET_FACTURAS, { headers: headers, rows: await rows })
            return {
                status: 200,
                msg: resultinsert
            }
        } else {
            return {
                status: 200,
                msg: "Hubo un error al querer insertar"
            }
        }
    }

    const lastInvoice = async (pvId: number, fiscal: boolean, tipo: CbteTipos, entorno: boolean): Promise<{ lastInvoice: number }> => {
        const pvData: Array<INewPV> = await ptosVtaController.get(pvId);
        if (fiscal) {
            const afip = new AfipClass(pvData[0].cuit, pvData[0].cert_file || "drop_test.key", pvData[0].key_file || "drop.key", entorno);
            const lastfact = await afip.lastFact(pvData[0].pv, tipo);
            if (lastfact.status === 200) {
                return {
                    lastInvoice: Number(lastfact.data)
                }
            } else {
                throw new Error("Error interno. Probablemente no sea un punto de venta válido.")
            }
        } else {
            let filter: IWhereParams | undefined = undefined;
            let filters: Array<IWhereParams> = [];

            filter = {
                mode: EModeWhere.strict,
                concat: EConcatWhere.and,
                items: [
                    { column: Columns.facturas.pv, object: String(pvData[0].pv) },
                    { column: Columns.facturas.fiscal, object: String(0) }
                ]
            };
            filters.push(filter);
            const listUlt = await store.list(Tables.FACTURAS, [`MAX(${Columns.facturas.cbte}) AS lastInvoice`], filters, undefined, undefined, undefined, undefined);
            if (listUlt[0].lastInvoice > 0) {
                return {
                    lastInvoice: listUlt[0].lastInvoice
                }
            } else {
                return {
                    lastInvoice: 0
                }
            }
        }
    }

    const getFiscalDataInvoice = async (ncbte: number, pvId: number, fiscal: boolean, tipo: CbteTipos, entorno: boolean) => {
        const pvData: Array<INewPV> = await ptosVtaController.get(pvId);
        const afip = new AfipClass(pvData[0].cuit, pvData[0].cert_file || "drop_test.key", pvData[0].key_file || "drop.key", entorno);
        const dataInvoice = await afip.getInvoiceInfo(ncbte, pvData[0].pv, tipo);
        return dataInvoice.data
    }

    const newInvoice = async (
        newFact: IFactura,
        factFiscal: FactInscriptoProd |
            FactInscriptoProdNC |
            FactInscriptoServ |
            FactInscriptoServNC |
            FactMonotribProd |
            FactMonotribProdNC |
            FactMonotribServ |
            FactMonotribServNC |
            any,
        productsList: Array<IDetFactura>,
        fileName: string,
        filePath: string,
    ) => {

        const resultInsert = insertFact(newFact, productsList, factFiscal)

        setTimeout(() => {
            fs.unlinkSync(filePath)
        }, 6000);

        const dataFact = {
            fileName,
            filePath,
            resultInsert
        }
        return dataFact
    }

    const createFiscalInvoice = async (body: INewFactura, entorno: boolean) => {
        const pvId = body.pv_id;
        const pvData = await ptosVtaController.get(pvId);
        const afip = new AfipClass(pvData[0].cuit, pvData[0].cert_file || "drop_test.key", pvData[0].key_file || "drop.key", entorno);
    }

    const sendInvoice = () => {

    }

    return {
        lastInvoice,
        list,
        remove,
        get,
        newInvoice,
        getFiscalDataInvoice
    }
}
