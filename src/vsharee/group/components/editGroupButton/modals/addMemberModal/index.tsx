import { Modal } from '@/utilities/components';
import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import { AddMemberModalProps } from './type';
import { GroupMembersType, GroupRoleEnum } from '@/interfaces';
import { useAtomValue } from 'jotai';
import { userDataAtom } from '@/atom';
import { put } from '@/scripts';
import { API } from '@/data';
import { toast } from 'react-toastify';
import AddMemberInput from './memberInput';

const AddMemberModal: React.FC<AddMemberModalProps> = (props: AddMemberModalProps) => {
    const [loading, setLoading] = useState(false);

    const userData = useAtomValue(userDataAtom);
    const initialMembers: GroupMembersType[] = [
        ...(userData ? [{ role: GroupRoleEnum.CREATOR, user: userData }] : []),
        ...(props.groupData?.members?.filter((m) => m.user?.id !== userData?.id) ?? []),
    ];

    const [members, setMembers] = useState<GroupMembersType[]>(initialMembers);

    useEffect(() => {
        if (!props.groupData) return;
        setMembers([
            ...(userData ? [{ role: GroupRoleEnum.CREATOR, user: userData }] : []),
            ...props.groupData.members.filter((m) => m.user?.id !== userData?.id),
        ]);
    }, [props.groupData, userData]);

    /** Index-aware change handler for a row */
    const changeMemberHandler = (index: number, newMember: GroupMembersType) => {
        setMembers((prev) => {
            const next = [...prev];

            // Ensure array is long enough if user types in the blank row
            if (index >= next.length) next.length = index + 1;

            // Only set when a user is selected; otherwise keep row empty
            next[index] = newMember?.user ? newMember : (undefined as unknown as GroupMembersType);

            // Compact out empties
            let compact = next.filter(Boolean) as GroupMembersType[];

            // Keep CREATOR at top exactly once
            if (userData) {
                const creatorId = userData.id;
                const withoutCreator = compact.filter((m) => m.user?.id !== creatorId);
                compact = [{ role: GroupRoleEnum.CREATOR, user: userData }, ...withoutCreator];
            }

            // De-duplicate by user id (keep first occurrence)
            const seen = new Set<string>();
            compact = compact.filter((m) => {
                const id = m.user?.id;
                if (!id) return false;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });

            return compact;
        });
    };

    /** Remove row by index (no-op for CREATOR) */
    const removeMember = (index: number) => {
        setMembers((prev) => {
            if (index < 0 || index >= prev.length) return prev;
            if (prev[index]?.role === GroupRoleEnum.CREATOR) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const submitHandler = () => {
        if (!props.groupData) return;
        setLoading(true);

        put(
            API.group.members(props.groupData.id),
            members.map((m) => ({ id: m.user?.id, role: m.role })),
        )
            .then(() => {
                toast.success('Members of the group has been updated successfully');
                props.onClose(true);
            })
            .catch((err) => {
                console.error(err);
                toast.error('Failed to update group members');
            })
            .finally(() => setLoading(false));
    };

    return (
        <Modal width={600} isOpen={!!props.groupData} onClose={props.onClose} title="Add Member">
            <div className="flex w-full flex-col gap-4">
                <div className="flex flex-col gap-4">
                    {[...members, { user: undefined, role: GroupRoleEnum.MEMBER }].map((item, index) => (
                        <AddMemberInput
                            key={index}
                            isLastOne={index === members.length}
                            defaultValue={item.user ? item : undefined}
                            onChange={(v) => changeMemberHandler(index, v)}
                            delete={() => removeMember(index)}
                        />
                    ))}
                </div>

                <div className="mt-4 flex w-full items-center gap-2">
                    <Button
                        size="large"
                        className="flex-2"
                        variant="contained"
                        onClick={submitHandler}
                        loading={loading}
                    >
                        Confirm
                    </Button>
                    <Button onClick={() => props.onClose()} size="large" className="flex-1" variant="text">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AddMemberModal;
