import { useParams } from "react-router-dom";

const CollectionView = () => {
    const { id } = useParams();

    return (
        <h1>/collections/{id}</h1>
    )
};

export default CollectionView;