import { PostcardViewer } from '../ui/PostcardViewer.js';

export class PostcardScene {
    async enter(container) {
        this._container = container;
        container.className = 'scene scene--postcards';
        const viewer = new PostcardViewer();
        viewer.render(container);
    }

    exit() { this._container = null; }
}
