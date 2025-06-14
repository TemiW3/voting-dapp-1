import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { BankrunProvider, startAnchor } from 'anchor-bankrun'
import { before } from 'node:test'

const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey('DJpAe4eaU4LhfdXFh5dVitTGneKMfXaUZXt3fF7ASjSJ')

describe('Voting', () => {
  let provider
  let context
  anchor.setProvider(anchor.AnchorProvider.env())
  let votingProgram = anchor.workspace.Voting as Program<Voting>

  beforeAll(async () => {
    // context = await startAnchor('', [{ name: 'voting', programId: votingAddress }], [])
    // provider = new BankrunProvider(context)
    // votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Initialize Poll', async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        new anchor.BN(0),
        new anchor.BN(1849651857),
        'What is you favourite type of shoe?',
      )
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    console.log('Poll:', poll)

    expect(poll.pollId.toNumber()).toEqual(1)
    expect(poll.description).toEqual('What is you favourite type of shoe?')
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber())
  })

  it('Initialize Candidate', async () => {
    await votingProgram.methods.initializeCandidate('Nike', new anchor.BN(1)).rpc()
    await votingProgram.methods.initializeCandidate('Adidas', new anchor.BN(1)).rpc()

    const [nikeAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Nike')],
      votingAddress,
    )

    const nikeCandidate = await votingProgram.account.candidate.fetch(nikeAddress)
    console.log('Nike Candidate:', nikeCandidate)
    expect(nikeCandidate.candidateVotes.toNumber()).toEqual(0)

    const [adiddasAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Adidas')],
      votingAddress,
    )
    const adiddasCandidate = await votingProgram.account.candidate.fetch(adiddasAddress)
    console.log('Adiddas Candidate:', adiddasCandidate)
    expect(adiddasCandidate.candidateVotes.toNumber()).toEqual(0)
  })

  it('Vote', async () => {
    await votingProgram.methods.vote('Nike', new anchor.BN(1)).rpc()

    const [nikeAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Nike')],
      votingAddress,
    )
    const nikeCandidate = await votingProgram.account.candidate.fetch(nikeAddress)
    console.log('Nike Candidate after vote:', nikeCandidate)
    expect(nikeCandidate.candidateVotes.toNumber()).toEqual(1)
  })
})
