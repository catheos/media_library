import { useParams } from "react-router-dom";

const UserView = () => {
    const { id } = useParams();

    return (
        <h1>/users/{id}</h1>
    )
};

export default UserView;