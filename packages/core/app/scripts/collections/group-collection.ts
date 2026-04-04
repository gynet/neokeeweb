import { Collection } from 'framework/collection';
import { GroupModel } from 'models/group-model';

class GroupCollection extends Collection {
    static override model = GroupModel;
}

export { GroupCollection };
