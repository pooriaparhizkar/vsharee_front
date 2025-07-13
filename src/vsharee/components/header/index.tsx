import { useAtom, useSetAtom } from 'jotai';
import { authStatusAtom, userDataAtom } from '@/atom';
import { AuthStatus } from '@/interfaces';
import { authToken } from '@/scripts';

const Header: React.FC = () => {
    const [userData, setUserData] = useAtom(userDataAtom);
    const setAuthStatus = useSetAtom(authStatusAtom);

    function logout() {
        authToken.remove();
        setUserData(null);
        setAuthStatus(AuthStatus.inValid);
    }
    return (
        <div className="border-b-primary-20 fixed top-0 left-0 z-10 flex h-full max-h-20 min-h-20 w-full items-center border-b px-4 pr-[276px] max-[768px]:pr-[64px]">
            <h1>vSharee</h1>
        </div>
    );
};

export default Header;
