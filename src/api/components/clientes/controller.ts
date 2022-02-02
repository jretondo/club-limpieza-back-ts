import { AfipClass } from './../../../utils/facturacion/AfipClass';

import { Ipages, IWhereParams } from 'interfaces/Ifunctions';
import { IClientes } from 'interfaces/Itables';
import { EConcatWhere, EModeWhere, ESelectFunct } from '../../../enums/EfunctMysql';
import { Tables, Columns } from '../../../enums/EtablesDB';
import StoreType from '../../../store/mysql';
import getPages from '../../../utils/getPages';

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

    const upsert = async (body: IClientes) => {
        const cliente: IClientes = {
            cuit: body.cuit,
            ndoc: body.ndoc,
            razsoc: body.razsoc,
            telefono: body.telefono,
            email: body.email,
            cond_iva: body.cond_iva
        }

        if (body.id) {
            return await store.update(Tables.CLIENTES, cliente, body.id);
        } else {
            return await store.insert(Tables.CLIENTES, cliente);
        }
    }

    const remove = async (idCliente: number) => {
        return await store.remove(Tables.CLIENTES, { id: idCliente });
    }

    const get = async (idCliente: number) => {
        return await store.get(Tables.CLIENTES, idCliente);
    }

    const dataFiscalPadron = async (cuit: number, cert: string, key: string, cuitPv: number) => {
        const afip = new AfipClass(cuitPv, cert, key, true);
        const dataFiscal = await afip.getDataCUIT(cuit);
        return dataFiscal
    }

    return {
        list,
        upsert,
        remove,
        get,
        dataFiscalPadron
    }
}
