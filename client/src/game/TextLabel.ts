import * as THREE from 'three';

export class TextLabel {
    text: string;
    protected sprite?: THREE.Sprite;

    constructor(text: string) {
        this.text = text;
        this.createLabel();
    }

    setText = (text: string) => {
        if (this.text !== text) {
            this.text = text;
            const spriteMaterial = this.createMaterial();
            if (this.sprite && spriteMaterial) {
                this.sprite.material = spriteMaterial;
            }
        }
    }

    loadLabel = (scene: THREE.Scene) => {
        this.sprite && scene.add(this.sprite);
    }

    removeLabel = (scene: THREE.Scene) => {
        this.sprite && scene.remove(this.sprite);
    }

    createMaterial = (): THREE.SpriteMaterial | undefined => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '20px Georgia';
            ctx.fillText(this.text, 10, 50);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            return new THREE.SpriteMaterial({ map: texture });
        }
    }

    createLabel = () => {
        const spriteMaterial = this.createMaterial();
        if (spriteMaterial) {
            this.sprite = new THREE.Sprite(spriteMaterial);
        }
    }

    updateLabel = (text: string, position: THREE.Vector3) => {
        this.setText(text);
        this.sprite && this.sprite.position.copy(position);
    }
}