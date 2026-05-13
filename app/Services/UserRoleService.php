<?php

namespace App\Services;

use App\Repositories\UserRepository;

class UserRoleService
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    /**
     * Check if employee is a Department Head (has approval rights in masterlist)
     */
    public function isDepartmentHead(string $userId): bool
    {
        return $this->userRepository->isDepartmentHead($userId);
    }
    public function isOperationDirector(string $userId): bool
    {
        return $this->userRepository->isOperationDirector($userId);
    }
    public function isMisEmp(string $userId): bool
    {
        return $this->userRepository->isMisEmp($userId);
    }
    public function getRole(string $userId): array
    {
        $roles = [];

        if ($this->userRepository->isOperationDirector($userId)) {
            $roles[] = 'OPERATION_DIRECTOR';
        }

        if ($this->userRepository->isDepartmentHead($userId)) {
            $roles[] = 'DEPARTMENT_HEAD';
        }

        if ($this->userRepository->isMisEmp($userId)) {
            $roles[] = 'MIS_SUPPORT';
        }

        return $roles;
    }
    public function getCanRequest(string $userId): bool
    {
     
        return $this->userRepository->getCanRequest($userId);
    }
    public function getEmployees(): array
    {
        return $this->userRepository->getEmployees();
    }
    public function getStaffList(string $empId): ?object
    {
        return $this->userRepository->getStaffList($empId);
    }
}
