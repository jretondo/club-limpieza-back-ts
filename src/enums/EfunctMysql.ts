export enum EModeWhere {
    strict,
    like,
    dif
}

export enum EConcatWhere {
    and,
    or,
    none
}

export enum ESelectFunct {
    count = 'COUNT',
    all = '*',
    sum = 'SUM',
    max = 'MAX',
    prepAlias = 'AS'
}

export enum EPermissions {
    ptosVta = 1,
    productos = 2,
    stock = 3,
    proveedores = 4,
    clientes = 5,
    revendedores = 6,
    transportistas = 7,
    userAdmin = 8
}

export enum ETypesJoin {
    left = "LEFT",
    right = "RIGHT",
    none = ""
}