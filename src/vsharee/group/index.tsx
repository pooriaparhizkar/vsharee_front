import { useParams } from 'react-router-dom';

const Group: React.FC = () => {
    const { id } = useParams();
    return (
        <div>
            <h1>{id}</h1>
            <h1>Group</h1>
        </div>
    );
};

export default Group;
