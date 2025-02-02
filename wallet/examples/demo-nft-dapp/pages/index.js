// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import Head from 'next/head';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from '../styles/Home.module.css';

const DEFAULT_NAME = 'Example NFT';
const DEFAULT_DESCRIPTION = 'An example NFT created by demo Dapp';
const DEFAULT_URL =
    'ipfs://bafkreibngqhl3gaa7daob4i2vccziay2jjlp435cf66vhono7nrvww53ty';

export default function Home() {
    const [walletInstalled, setWalletInstalled] = useState(null);
    const [connected, setConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [msgNotice, setMsgNotice] = useState(null);
    const [account, setAccount] = useState(null);
    useEffect(() => {
        const suiWallet = window.suiWallet;
        setWalletInstalled(!!suiWallet);
        if (suiWallet) {
            suiWallet.hasPermissions().then(setConnected, setMsgNotice);
        }
    }, []);
    const onConnectClick = useCallback(async () => {
        setConnecting(true);
        try {
            await window.suiWallet.requestPermissions();
            setConnected(true);
        } catch (e) {
            setMsgNotice(e);
        } finally {
            setConnecting(false);
        }
    }, []);
    useEffect(() => {
        if (connected) {
            window.suiWallet
                .getAccounts()
                .then((accounts) => setAccount(accounts[0]), setMsgNotice);
        } else {
            setAccount(null);
        }
    }, [connected]);
    useEffect(() => {
        let timeout;
        if (msgNotice) {
            timeout = setTimeout(() => setMsgNotice(null), 10000);
        }
        return () => clearTimeout(timeout);
    }, [msgNotice]);
    const [creating, setCreating] = useState(false);
    const nameRef = useRef();
    const descRef = useRef();
    const urlRef = useRef();
    const onCreateClick = useCallback(async () => {
        setCreating(true);
        const name = (nameRef.current?.value || DEFAULT_NAME).trim();
        const desc = (descRef.current?.value || DEFAULT_DESCRIPTION).trim();
        const url = (urlRef.current?.value || DEFAULT_URL).trim();
        try {
            const result = await window.suiWallet.executeMoveCall({
                packageObjectId: '0x2',
                module: 'devnet_nft',
                function: 'mint',
                typeArguments: [],
                arguments: [name, desc, url],
                gasBudget: 10000,
            });
            const nftID =
                result?.EffectResponse?.effects?.created?.[0]?.reference
                    ?.objectId;
            // eslint-disable-next-line no-console
            console.log('NFT id', nftID);
            setMsgNotice(
                `NFT successfully created. ${nftID ? `ID: ${nftID}` : ''}`
            );
            nameRef.current && (nameRef.current.value = '');
            descRef.current && (descRef.current.value = '');
            urlRef.current && (urlRef.current.value = '');
        } catch (e) {
            setMsgNotice(e);
        } finally {
            setCreating(false);
        }
    }, []);
    return (
        <div className={styles.container}>
            <Head>
                <title>Demo NFT Dapp</title>
                <link rel="icon" href="/favicon.png" />
            </Head>

            <main className={styles.main}>
                {walletInstalled ? (
                    <div>
                        {connected ? (
                            <>
                                <h4>Wallet connected</h4>
                                <label>
                                    Wallet account: <div>{account}</div>
                                </label>
                                <div>
                                    <h2>Create NFTs</h2>
                                    <label>
                                        Name:{' '}
                                        <input
                                            type="text"
                                            placeholder={DEFAULT_NAME}
                                            ref={nameRef}
                                        />
                                    </label>
                                    <label>
                                        Description:{' '}
                                        <input
                                            type="text"
                                            placeholder={DEFAULT_DESCRIPTION}
                                            ref={descRef}
                                        />
                                    </label>
                                    <label>
                                        Image url:{' '}
                                        <input
                                            type="text"
                                            placeholder={DEFAULT_URL}
                                            ref={urlRef}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={onCreateClick}
                                        disabled={creating}
                                    >
                                        Create
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={onConnectClick}
                                disabled={connecting}
                            >
                                Connect
                            </button>
                        )}
                    </div>
                ) : walletInstalled === false ? (
                    <h6>It seems Sui Wallet is not installed.</h6>
                ) : null}
                {msgNotice ? (
                    <div className="error">
                        <pre>
                            {msgNotice.message ||
                                JSON.stringify(msgNotice, null, 4)}
                        </pre>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
