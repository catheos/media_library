import { useParams } from "react-router-dom";

const MediaView = () => {
    const { id } = useParams();

    return (
        <h1>/media/{id}</h1>
    )
};

export default MediaView;