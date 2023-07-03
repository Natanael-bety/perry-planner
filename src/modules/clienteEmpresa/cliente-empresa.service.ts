import { IParamsCreateClientCompany } from "./cliente-empresa.interfaces";
import { prisma } from "../../config/prisma";
import { NotFoundError, UnprocessableEntityError } from "../../helpers/errors";

export class ClienteEmpresaService {
  async create(params: IParamsCreateClientCompany) {
    const {
      bairro,
      cpf_cnpj,
      nome,
      numero,
      telefone,
      rua,
      diaVencimento,
      empresaId
    } = params;
    let clientId = "";

    const user = await prisma.usuario.findUnique({
      where: { cpf_cnpj }
    });

    if (user) {
      clientId = user.id;
    } else {
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          cpf_cnpj,
          telefone,
          bairro,
          numero,
          rua
        }
      });

      clientId = newUser.id;
    }

    const clientCompany = await prisma.clienteEmpresa.findFirst({
      where: {
        clienteId: clientId,
        empresaId
      }
    });

    if (clientCompany) {
      throw new UnprocessableEntityError(
        "Cliente já está cadastrado nessa empresa."
      );
    }

    return await prisma.clienteEmpresa.create({
      data: {
        clienteId: clientId,
        empresaId,
        diaVencimento: Number(diaVencimento)
      }
    });
  }

  async getAllByCompanyId(empresaId: string) {
    const company = await prisma.usuario.findUnique({
      where: {
        id: empresaId
      }
    });

    if (!company) {
      throw new NotFoundError("Empresa não existe.");
    }

    const clients = await prisma.clienteEmpresa.findMany({
      where: {
        empresaId
      }
    });

    const accounts = [];

    for (const client of clients) {
      const clientsAccounts = await prisma.conta.findMany({
        where: {
          clienteEmpresaId: client.id
        }
      });

      accounts.push(...clientsAccounts);
    }

    for (const account of accounts) {
      const currentDate = new Date();

      if (account.dataVencimento < currentDate) {
        const qtDaysOverdue = getDaysDifferenceBetweenDates(
          account.dataVencimento,
          currentDate
        );

        const INTEREST_RATE = 0.02;
        const fees = account.totalSemJuros * INTEREST_RATE * qtDaysOverdue;

        await prisma.conta.update({
          where: {
            id: account.id
          },
          data: {
            juros: fees,
            dataCobrancaJuros: currentDate,
            updatedAt: currentDate
          }
        });
      }
    }

    return await prisma.clienteEmpresa.findMany({
      where: {
        empresaId
      },
      include: {
        cliente: true,
        contas: true
      }
    });
  }

  async delete(clienteEmpresaId: string) {
    const clienteEmpresa = await prisma.clienteEmpresa.findUnique({ where: { id: clienteEmpresaId } });

    if (!clienteEmpresa) {
      throw new NotFoundError("cliente não existe.");
    }

    await prisma.clienteEmpresa.delete({ where: { id: clienteEmpresaId } });
  }
}

const getDaysDifferenceBetweenDates = (
  expirationDate: any,
  currentDate: any
) => {
  const diffInMilliseconds = currentDate - expirationDate;

  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  const diffInDays = Math.floor(diffInMilliseconds / oneDayInMilliseconds);

  return diffInDays;
};


