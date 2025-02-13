import { useEffect, useState } from 'react'
import { Button, ListGroup, Row, Col } from 'react-bootstrap'
import Select from 'react-select'
import { ConfirmInscriptionChangeButton } from '.'
import classNames from 'classnames'
import { CommonModal } from '../components'

import { useGetSessionsQuery, useCreateEvaluationMutation } from '../services/evaluations'
import { useGetEvaluationsQuery } from '../services/evaluationTemplates'
import { useGetTemplatesQuery } from '../services/templates'
import { useLazyGetUsersQuery } from '../services/sessions'
import { toast } from 'react-toastify'

export const EvaluationModal = ({ closeModal, isVisible, data }) => {
    const {
        data: evaluationTemplates,
        isLoading: isLoadingTemplates,
        isError: isErrorTemplates,
    } = useGetEvaluationsQuery()

    const { data: emailTemplates, isLoading: isLoadingEmailTemplates, isError: isEmailError } = useGetTemplatesQuery()

    const {
        data: sessions,
        isLoading: isLoadingSessions,
        isError: isSessionsError,
    } = useGetSessionsQuery(null, {
        refetchOnMountOrArgChange: true,
    })

    const [fetchUsers, { data: users = [], isLoading: isUsersFetching }] = useLazyGetUsersQuery()

    const [createEvaluation, { isLoading: isEvaluationCreating }] = useCreateEvaluationMutation()

    const [selectedTemplateUuid, setSelectedTemplateUuid] = useState(null)
    const [selectedEmailUuid, setSelectedEmailUuid] = useState(null)
    const [selectedSession, setSelectedSession] = useState(null)
    const [selectedUserUuids, setSelectedUserUuids] = useState([])

    useEffect(() => {
        if (isVisible && data) {
            setSelectedTemplateUuid(data.template)
            setSelectedSession(data.session)
        }
    }, [isVisible])

    const onCloseModal = (doesntClose = false) => {
        if (doesntClose) return
        setSelectedTemplateUuid(null)
        setSelectedEmailUuid(null)
        setSelectedSession(null)
        setSelectedUserUuids([])
        closeModal()
    }

    useEffect(() => {
        if (selectedSession !== null) {
            fetchUsers({
                sessionId: selectedSession.value,
            }).then((response) => {
                if (response.data) setSelectedUserUuids(response.data.map((user) => user.uuid))
            })
        }
    }, [selectedSession])

    return (
        <CommonModal
            title={"Génération d'évaluation"}
            dialogClassName="update-modal create-evaluation-modal"
            backdrop="static"
            isVisible={isVisible}
            onHide={() => onCloseModal()}
            content={
                <Row>
                    <Col>
                        <h6>Choix de modèle d'évaluation</h6>
                        {isLoadingTemplates ? (
                            'Chargement...'
                        ) : isErrorTemplates ? (
                            'Erreur de chargement des modèles.'
                        ) : (
                            <ListGroup>
                                {evaluationTemplates.map(({ title, description, uuid }) => (
                                    <ListGroup.Item
                                        key={uuid}
                                        onClick={() => {
                                            setSelectedTemplateUuid(uuid)
                                        }}
                                        className={classNames({
                                            'active-template': selectedTemplateUuid === uuid,
                                        })}
                                    >
                                        <h4>{title}</h4>
                                        <p>{description}</p>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                        <h6 className="mt-4">Choix de modèle d'e-mail</h6>
                        {isLoadingEmailTemplates ? (
                            'Chargement...'
                        ) : isEmailError ? (
                            'Erreur de chargement des modèles.'
                        ) : (
                            <ListGroup>
                                {emailTemplates
                                    .filter((template) => template.usedByEvaluation)
                                    .map(({ title, description, templateId }) => (
                                        <ListGroup.Item
                                            key={templateId}
                                            onClick={() => setSelectedEmailUuid(templateId)}
                                            className={classNames({
                                                'active-template': selectedEmailUuid === templateId,
                                            })}
                                        >
                                            <h4>{title}</h4>
                                            <p>{description}</p>
                                        </ListGroup.Item>
                                    ))}
                            </ListGroup>
                        )}
                        <h6 className="mt-4">Choix de la session</h6>
                        {isLoadingSessions ? (
                            'Chargement...'
                        ) : isSessionsError ? (
                            'Erreur de chargement des modèles.'
                        ) : (
                            <Select
                                options={sessions.map(({ uuid, course_name }) => ({
                                    label: course_name,
                                    value: uuid,
                                }))}
                                value={selectedSession}
                                onChange={(session) => setSelectedSession(session)}
                            />
                        )}
                    </Col>
                    <Col>
                        <h6>Choix des participants</h6>
                        {selectedSession ? (
                            isUsersFetching ? (
                                <span>Chargement des participants</span>
                            ) : users.length > 0 ? (
                                <ListGroup>
                                    {users.map(({ uuid, fullname }) => (
                                        <ListGroup.Item
                                            key={uuid}
                                            onClick={() => {
                                                const index = selectedUserUuids.indexOf(uuid)
                                                if (index >= 0)
                                                    setSelectedUserUuids([
                                                        ...selectedUserUuids.slice(0, index),
                                                        ...selectedUserUuids.slice(index + 1),
                                                    ])
                                                else setSelectedUserUuids([...selectedUserUuids, uuid])
                                            }}
                                            className={classNames({
                                                'active-template': selectedUserUuids.includes(uuid),
                                            })}
                                        >
                                            <p>{fullname}</p>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            ) : (
                                <span>Il y a aucun participant dans cette session</span>
                            )
                        ) : (
                            <span>Veuillez sélectionner une session</span>
                        )}
                    </Col>
                </Row>
            }
            footer={
                <>
                    <ConfirmInscriptionChangeButton
                        isSelectedTemplateDataNull={
                            selectedTemplateUuid === null ||
                            selectedEmailUuid === null ||
                            selectedUserUuids.length === 0
                        }
                        isLoading={isEvaluationCreating}
                        variant="primary"
                        onClick={() => {
                            createEvaluation({
                                session: selectedSession.value,
                                template: selectedTemplateUuid,
                                email: selectedEmailUuid,
                                users: selectedUserUuids,
                            }).then((response) => {
                                const msg = response.error ? response.error : response.data.message
                                if (!response.error) toast.success(msg)
                                onCloseModal()
                            })
                        }}
                    >
                        Générer évaluation
                    </ConfirmInscriptionChangeButton>
                    <Button variant="outline-primary" onClick={() => onCloseModal()}>
                        Annuler
                    </Button>
                </>
            }
        />
    )
}
