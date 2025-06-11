import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from '@solana/actions'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Voting } from '../../../../anchor/target/types/voting'
import { BN, Program } from '@coral-xyz/anchor'

const IDL = require('../../../../anchor/target/idl/voting.json')

export const OPTIONS = GET

export async function GET(request: Request) {
  const actionMetaData: ActionGetResponse = {
    icon: 'https://media.about.nike.com/image-downloads/cf68f541-fc92-4373-91cb-086ae0fe2f88/002-nike-logos-swoosh-white.jpg',
    title: 'Vote for your favourite shoe brand',
    description: 'Vote between Nike and Adidas',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Nike',
          href: '/api/vote?candidate=Nike',
        },
        {
          label: 'Vote for Adidas',
          href: '/api/vote?candidate=Adidas',
        },
      ],
    },
  }
  return Response.json(actionMetaData, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get('candidate')

  if (!candidate || (candidate !== 'Nike' && candidate !== 'Adidas')) {
    return Response.json({ error: 'Invalid candidate' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const connection = new Connection('http://127.0.0.1:8899', 'confirmed')
  const program: Program<Voting> = new Program(IDL, { connection })

  const body: ActionPostRequest = await request.json()

  let voter

  try {
    voter = new PublicKey(body.account)
  } catch (error) {
    return Response.json({ error: 'Invalid account' }, { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const instruction = await program.methods.vote(candidate, new BN(1)).accounts({ signer: voter }).instruction()

  const blockHash = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
  }).add(instruction)

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
    },
  })

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS })
}
