import {
  createProspect,
  listProspects,
} from "../lib/db";

const SAMPLE_PROSPECTS = [
  {
    nome: "Carlos Mendes",
    empresa: "Tech Solutions SP",
    telefone: "11999887766",
    email: "carlos@techsolutions.com.br",
    endereco: "Av. Paulista, 1000",
    cidade: "São Paulo",
    estado: "SP",
    latitude: -23.5629,
    longitude: -46.6544,
    segmento: "Tecnologia",
    status: "novo" as const,
    observacoes: "Empresa de desenvolvimento de software",
  },
  {
    nome: "Ana Paula Silva",
    empresa: "Marketing Digital RJ",
    telefone: "21988776655",
    email: "ana@marketingdigital.rj",
    endereco: "Rua do Ouvidor, 50",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    latitude: -22.9035,
    longitude: -43.1776,
    segmento: "Marketing",
    status: "novo" as const,
    observacoes: null,
  },
  {
    nome: "Roberto Alves",
    empresa: "Construtora Horizonte",
    telefone: "31977665544",
    email: null,
    endereco: "Av. Afonso Pena, 1500",
    cidade: "Belo Horizonte",
    estado: "MG",
    latitude: -19.9167,
    longitude: -43.9345,
    segmento: "Construção",
    status: "contatado" as const,
    observacoes: "Já enviou mensagem de apresentação",
  },
  {
    nome: "Fernanda Costa",
    empresa: "Clínica Bem Estar",
    telefone: "41966554433",
    email: "contato@clinicabemestar.com.br",
    endereco: "Rua XV de Novembro, 300",
    cidade: "Curitiba",
    estado: "PR",
    latitude: -25.4284,
    longitude: -49.2733,
    segmento: "Saúde",
    status: "interessado" as const,
    observacoes: null,
  },
  {
    nome: "João Pedro Santos",
    empresa: "Logística Express",
    telefone: "51955443322",
    email: "jp@logisticaexpress.com.br",
    endereco: "Av. Borges de Medeiros, 800",
    cidade: "Porto Alegre",
    estado: "RS",
    latitude: -30.0346,
    longitude: -51.2177,
    segmento: "Logística",
    status: "novo" as const,
    observacoes: null,
  },
];

function seed() {
  const existing = listProspects();
  if (existing.length > 0) {
    console.log(`Banco já possui ${existing.length} prospects. Seed ignorado.`);
    return;
  }

  for (const p of SAMPLE_PROSPECTS) {
    createProspect(p);
  }

  console.log(`✓ ${SAMPLE_PROSPECTS.length} prospects de exemplo cadastrados.`);
}

seed();
