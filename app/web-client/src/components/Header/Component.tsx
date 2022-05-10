/**
 * Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiHeader,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHideFor,
  EuiSuperSelect,
  EuiText,
} from "fury-design-system";
import "./Style.css";
import {
  MouseEventHandler,
  MouseEvent,
  useContext,
  useEffect,
  useState,
} from "react";
import { ApplicationContext } from "../../AppContext";
import { EuiSuperSelectOption } from "fury-design-system/src/components/form/super_select/super_select_control";
import { useLocation } from "react-router-dom";

function HeaderComponent() {
  const [optionsFromContexts, setOptionsFromContexts] = useState<
    EuiSuperSelectOption<string>[]
  >([]);
  const { context, setContext } = useContext(ApplicationContext);
  const { pathname } = useLocation();
  const routes = [
    {
      path: "/",
      name: "Home",
    },
    {
      path: "/constrainttemplates",
      name: "Constraint Templates",
    },
    {
      path: "/constraints",
      name: "Constraints",
    },
    {
      path: "/configurations",
      name: "Configurations",
    },
  ];

  useEffect(() => {
    const optionsFromContexts = context.k8sContexts.map((k8sContext) => {
      return {
        value: k8sContext,
        inputDisplay: k8sContext,
        dropdownDisplay: (
          <EuiText
            size="s"
            style={{
              maxWidth: "200px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {k8sContext}
          </EuiText>
        ),
      };
    });
    setOptionsFromContexts(optionsFromContexts);
  }, [context.k8sContexts]);

  const doLogout: MouseEventHandler<HTMLButtonElement> = (
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    fetch(`${context.apiUrl}/api/v1/auth/logout`, { method: "POST" }).finally(
      () => {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    );
  };

  const onChangeContext = (value: string) => {
    if (setContext) {
      setContext({
        currentK8sContext: value,
      });
    }
  };

  return (
    <div className="gpm-header">
      <EuiHideFor sizes={["xs", "s"]}>
        <EuiHeader className="gpm-header--desktop">
          <EuiHeaderSection side="left">
            {routes &&
              routes.map((route) => {
                return (
                  <EuiHeaderSectionItem
                    className={pathname === route.path ? "header-active" : ""}
                    key={route.path}
                  >
                    <EuiButtonEmpty href={route.path}>
                      {route.name}
                    </EuiButtonEmpty>
                  </EuiHeaderSectionItem>
                );
              })}
          </EuiHeaderSection>
          <EuiHeaderSection side="right">
            {optionsFromContexts.length > 0 && (
              <EuiHeaderSectionItem>
                <EuiText style={{ marginRight: "5px" }} size="s">
                  <p>
                    <strong>Context:</strong>
                  </p>
                </EuiText>
                <EuiSuperSelect
                  style={{ width: "200px" }}
                  options={optionsFromContexts}
                  valueOfSelected={context.currentK8sContext}
                  onChange={(value) => onChangeContext(value)}
                />
              </EuiHeaderSectionItem>
            )}
            {context.authEnabled && (
              <EuiHeaderSectionItem>
                <EuiButton
                  fill
                  iconType="push"
                  onClick={doLogout}
                  style={{ marginLeft: "15px" }}
                >
                  Logout
                </EuiButton>
              </EuiHeaderSectionItem>
            )}
          </EuiHeaderSection>
        </EuiHeader>
      </EuiHideFor>
    </div>
  );
}

export default HeaderComponent;
