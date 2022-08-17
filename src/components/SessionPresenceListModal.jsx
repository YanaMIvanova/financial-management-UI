import { Button, Spinner, Form, Table, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useForm } from 'react-hook-form'

import { CommonModal } from '../components'
import { useGetPresenceListQuery } from '../services/sessions'

export function SessionPresenceListModal({ sessionId, closeModal, isModalOpen }) {
    const {
        handleSubmit,
        register,
        formState: { isDirty },
    } = useForm()

    const {
        data: presenceList,
        isFetching,
        refetch: refetchPresenceList,
    } = useGetPresenceListQuery({ sessionId }, { refetchOnMountOrArgChange: true, skip: !isModalOpen })

    return (
        <CommonModal
            title="Liste de présences"
            content={
                <>
                    <Form.Group className="mb-3">
                        <Form.Label>Nom de la formation</Form.Label>
                        <Form.Control {...register('courseName')} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Dates de séances</Form.Label>
                        <Form.Control {...register('eventDates')} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Formateurs</Form.Label>
                        <Form.Control {...register('tutors')} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Code session</Form.Label>
                        <Form.Control {...register('sessionCode')} />
                    </Form.Group>
                    <Table bordered>
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Nom Prénom</th>
                                {presenceList?.eventDates.map((_, index) => (
                                    <th>
                                        {index + 1}
                                        <sup>{`${index + 1}`[0] === '1' ? 'er' : 'e'}</sup> jour
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {presenceList?.learners.map(({ firstName, lastName }, index) => (
                                <tr>
                                    <td>{index + 1}</td>
                                    <td>
                                        {lastName} {firstName}
                                    </td>
                                    {presenceList?.eventDates.map(() => (
                                        <td />
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </>
            }
            footer={
                <>
                    <OverlayTrigger
                        placement="top"
                        overlay={
                            <Tooltip>
                                {isDirty ? 'Appliquer la modification' : "Vous n'avez pas fait de modification"}
                            </Tooltip>
                        }
                    >
                        <div>
                            <Button variant="primary" disabled={!isDirty} onClick={handleSubmit(async (newData) => {})}>
                                {false ? (
                                    <>
                                        <Spinner animation="grow" size="sm" /> Télécharger Word (.docx)...
                                    </>
                                ) : (
                                    'Télécharger Word (.docx)'
                                )}
                            </Button>
                        </div>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Annuler votre modification</Tooltip>}>
                        <div>
                            <Button
                                variant="outline-primary"
                                onClick={() => {
                                    closeModal()
                                }}
                            >
                                Annuler
                            </Button>
                        </div>
                    </OverlayTrigger>
                </>
            }
            isVisible={isModalOpen}
            onHide={() => closeModal()}
            backdrop="static"
            dialogClassName="update-modal"
        />
    )
}
