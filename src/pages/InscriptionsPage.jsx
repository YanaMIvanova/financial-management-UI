import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'

import { Grid } from '../components'
import { transformFlagsToStatus } from '../utils'

export function InscriptionsPage() {
    const [inscriptions, setInscriptions] = useState(null)

    useEffect(() => {
        const fetchInscriptions = async () => {
            const inscriptionsResponse = await fetch('http://localhost:4000/inscriptions')
            setInscriptions(await inscriptionsResponse.json())
        }

        fetchInscriptions()
    }, [])

    const columnDefs = [
        {
            field: 'participant',
            headerName: 'Participant',
            filter: 'agSetColumnFilter',
            filterParams: { excelMode: 'windows' },
        },
        { field: 'profession', headerName: 'Fonction/Profession' },
        { field: 'session', headerName: 'Session', filter: 'agTextColumnFilter' },
        {
            field: 'status',
            headerName: 'Statut',
            editable: true,
            cellEditor: 'agRichSelectCellEditor',
            cellEditorParams: {
                values: [
                    'En attente',
                    'À traiter par RH',
                    'Réfusée par RH',
                    'Entrée Web',
                    'Acceptée par CEP',
                    'Invitée',
                    'Proposée',
                    'Annulée',
                    'Écartée',
                ],
            },
            onCellValueChanged: ({ data: { inscriptionId }, newValue }) => {
                // console.log(node)
                ;(async () => {
                    const inscriptionsResponse = await fetch(`http://localhost:4000/inscriptions/${inscriptionId}`, {
                        method: 'post',
                        mode: 'no-cors',
                        body: JSON.stringify({ status: newValue }),
                    })

                    console.log(inscriptionsResponse)
                    const json = await inscriptionsResponse.json()

                    console.log(json)
                })()
            },
        },
        { field: 'startDate', headerName: 'Date de début', filter: 'agDateColumnFilter' },
    ]

    console.log('inscriptions', inscriptions)

    const rowData = inscriptions?.map(({ id: inscriptionId, user, session, validated, confirmed, date }) => ({
        inscriptionId,
        participant: user.name,
        profession: '(à faire)',
        session: session.name,
        status: transformFlagsToStatus({ validated, confirmed }),
        startDate: date,
    }))

    return (
        <Container fluid>
            <h1 className="mt-3">Inscriptions</h1>

            <Grid columnDefs={columnDefs} rowData={rowData} />
        </Container>
    )
}
