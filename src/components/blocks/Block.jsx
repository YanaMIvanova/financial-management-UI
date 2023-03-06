import { Form } from 'react-bootstrap'

import Notes from './Notes'
import Paragraph from './Paragraph'
import Remark from './Remark'
import Title from './Title'

const blocks = [Title, Paragraph, Notes, Remark].reduce(
    (acc, component) => ({
        ...acc,
        [component.type]: component,
    }),
    {}
)

export const Block = {
    Render: (props) => {
        const Block = blocks[props.type]
        return (
            <div className={`block render ${props.type}`}>
                <Block.Render {...props} />
            </div>
        )
    },
    Preview: (props) => {
        const Block = blocks[props.type]
        return (
            <div
                className={`block preview ${props.type} ${props.selected ? 'selected' : ''}`}
                onClick={(e) => {
                    e.preventDefault()
                    props.onSelected()
                }}
            >
                <Block.Preview {...props} />
            </div>
        )
    },
    Editor: ({ onUpdate, ...props }) => {
        const Block = blocks[props.type]
        return (
            <>
                <Form.Group className="mb-3">
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                        value={props.type}
                        onChange={(e) => {
                            const block = blocks[e.target.value]
                            onUpdate({
                                type: block.type,
                                ...block.default,
                            })
                        }}
                    >
                        {Object.entries(blocks).map(([type, block]) => (
                            <option key={type} value={type}>
                                {block.label}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Identifiant</Form.Label>
                    <Form.Control
                        key="identifier"
                        type="text"
                        placeholder="Identifiant"
                        defaultValue={props.identifier}
                        onChange={(e) =>
                            onUpdate({
                                ...props,
                                identifier: e.target.value,
                            })
                        }
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Check
                        key="required"
                        type="checkbox"
                        label="Champ obligatoire"
                        checked={props.required}
                        onChange={(e) =>
                            onUpdate({
                                ...props,
                                required: e.target.checked,
                            })
                        }
                    />
                </Form.Group>
                <Block.Editor {...props} onUpdate={onUpdate} />
            </>
        )
    },
}
