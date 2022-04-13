import { IMovCtaCte } from './../../../interfaces/Itables';
import { AfipClass } from './../../../utils/facturacion/AfipClass';

import { Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { IClientes, IUser } from 'interfaces/Itables';
import { EConcatWhere, EModeWhere, ESelectFunct } from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';
import getPages from '../../../utils/getPages';
import { NextFunction } from 'express';

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
                    { column: Columns.clientes.telefono, object: String(item) },
                    { column: Columns.clientes.email, object: String(item) },
                    { column: Columns.clientes.ndoc, object: String(item) },
                    { column: Columns.clientes.razsoc, object: String(item) }
                ]
            };
            filters.push(filter);
        }

        let pages: Ipages;
        if (page) {
            pages = {
                currentPage: page,
                cantPerPage: cantPerPage || 10,
                order: Columns.clientes.id,
                asc: true
            };
            const data = await store.list(Tables.CLIENTES, [ESelectFunct.all], filters, undefined, pages);
            const cant = await store.list(Tables.CLIENTES, [`COUNT(${ESelectFunct.all}) AS COUNT`], filters, undefined, undefined);
            const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
            return {
                data,
                pagesObj
            };
        } else {
            const data = await store.list(Tables.CLIENTES, [ESelectFunct.all], filters, undefined, undefined);
            return {
                data
            };
        }
    }

    const upsert = async (body: IClientes, next: NextFunction) => {
        const cliente: IClientes = {
            cuit: body.cuit,
            ndoc: body.ndoc,
            razsoc: body.razsoc,
            telefono: body.telefono,
            email: body.email,
            cond_iva: body.cond_iva
        }

        try {
            if (body.id) {
                return await store.update(Tables.CLIENTES, cliente, body.id);
            } else {
                return await store.insert(Tables.CLIENTES, cliente);
            }
        } catch (error) {
            next(error)
        }
    }

    const remove = async (idCliente: number) => {
        const listCtaCte: {
            data: Array<IMovCtaCte>
        } = await listCtaCteClient(idCliente, false, false)
        console.log('listCtaCte :>> ', listCtaCte);
        const cant = listCtaCte.data.length
        if (cant > 0) {
            return 403
        } else {
            const result: any = await store.remove(Tables.CLIENTES, { id: idCliente });
            console.log('result :>> ', result);
            if (result.affectedRows > 0) {
                return 200
            } else {
                return 500
            }
        }
    }

    const get = async (idCliente: number) => {
        return await store.get(Tables.CLIENTES, idCliente);
    }

    const dataFiscalPadron = async (cuit: number, cert: string, key: string, cuitPv: number) => {
        let certDir = "drop.crt"
        let keyDir = "drop.key"
        if (process.env.ENTORNO === "PROD") {
            certDir = cert
            keyDir = key
        }
        const afip = new AfipClass(cuitPv, certDir, keyDir, true);
        const dataFiscal = await afip.getDataCUIT(cuit);
        return dataFiscal
    }

    const listCtaCteClient = async (idCliente: number, debit: boolean, credit: boolean, page?: number, cantPerPage?: number) => {

        console.log('idCliente :>> ', idCliente);
        let filter: IWhereParams | undefined = undefined;
        let filters: Array<IWhereParams> = [];

        if (!debit && !credit) {
            filter = {
                mode: EModeWhere.strict,
                concat: EConcatWhere.none,
                items: [
                    { column: Columns.ctaCte.id_cliente, object: String(idCliente) }
                ]
            };
            filters.push(filter);
        } else if (debit) {
            filter = {
                mode: EModeWhere.strict,
                concat: EConcatWhere.and,
                items: [
                    { column: Columns.ctaCte.id_cliente, object: String(idCliente) },
                ]
            };
            filters.push(filter);

            filter = {
                mode: EModeWhere.less,
                concat: EConcatWhere.and,
                items: [
                    { column: Columns.ctaCte.importe, object: String(0) },
                ]
            };
            filters.push(filter);
        } else if (credit) {
            filter = {
                mode: EModeWhere.strict,
                concat: EConcatWhere.and,
                items: [
                    { column: Columns.ctaCte.id_cliente, object: String(idCliente) },
                ]
            };
            filters.push(filter);

            filter = {
                mode: EModeWhere.higher,
                concat: EConcatWhere.and,
                items: [
                    { column: Columns.ctaCte.importe, object: String(0) },
                ]
            };
            filters.push(filter);
        }

        let pages: Ipages;
        if (page) {
            pages = {
                currentPage: page,
                cantPerPage: cantPerPage || 10,
                order: Columns.clientes.id,
                asc: true
            };
            const data = await store.list(Tables.CTA_CTE, [ESelectFunct.all], filters, undefined, pages);
            const cant = await store.list(Tables.CTA_CTE, [`COUNT(${ESelectFunct.all}) AS COUNT`], filters);
            const suma = await store.list(Tables.CTA_CTE, [`SUM(${Columns.ctaCte.importe}) as SUMA`], filters);
            const pagesObj = await getPages(cant[0].COUNT, 10, Number(page));
            return {
                data,
                pagesObj,
                suma
            };
        } else {
            const data = await store.list(Tables.CTA_CTE, [ESelectFunct.all], filters, undefined, undefined);
            const suma = await store.list(Tables.CTA_CTE, [`SUM(${Columns.ctaCte.importe}) as SUMA`], filters);
            return {
                data,
                suma
            };
        }
    }

    return {
        list,
        upsert,
        remove,
        get,
        dataFiscalPadron,
        listCtaCteClient
    }
}
