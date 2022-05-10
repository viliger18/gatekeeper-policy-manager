/**
 * Copyright (c) 2017-present SIGHUP s.r.l All rights reserved.
 * Use of this source code is governed by a BSD-style
 * license that can be found in the LICENSE file.
 */

import {
  EuiAccordion,
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiCallOut,
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiNotificationBadge,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageSideBar,
  EuiPanel,
  EuiSideNav,
  EuiSpacer,
  EuiText,
  EuiTitle,
  htmlIdGenerator,
} from "fury-design-system";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ApplicationContext } from "../../AppContext";
import { BackendError, ISideNav, ISideNavItem } from "../types";
import { JSONTree } from "react-json-tree";
import "./Style.css";
import { useLocation, useNavigate } from "react-router-dom";
import theme from "../theme";
import { scrollToElement } from "../../utils";
import { IConstraint } from "./types";
import useScrollToHash from "../../hooks/useScrollToHash";
import useCurrentElementInView from "../../hooks/useCurrentElementInView";

function generateSideNav(list: IConstraint[]): ISideNav[] {
  const sideBarItems = (list ?? []).map((item, index) => {
    return {
      key: `${item.metadata.name}-side`,
      name: item.metadata.name,
      id: htmlIdGenerator("constraints")(),
      onClick: () => {
        scrollToElement(`#${item.metadata.name}`, true);
      },
      isSelected: index === 0,
      icon: (
        <EuiBadge
          color={item.status?.totalViolations ?? 0 > 0 ? "danger" : "success"}
        >
          {item.status.totalViolations}
        </EuiBadge>
      ),
    } as ISideNavItem;
  });

  return [
    {
      name: "Constraints",
      id: htmlIdGenerator("constraints")(),
      items: sideBarItems,
    },
  ];
}

function SingleConstraint(item: IConstraint) {
  return (
    <EuiPanel grow={true} style={{ marginBottom: "24px" }}>
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem>
          <EuiFlexGroup
            justifyContent="flexStart"
            style={{ padding: 2 }}
            alignItems="center"
          >
            <EuiFlexItem grow={false}>
              <EuiText>
                <h4>{item.metadata.name}</h4>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge
                color={
                  item.spec
                    ? item.spec?.enforcementAction === "dryrun"
                      ? "primary"
                      : "warning"
                    : "hollow"
                }
                iconType={
                  item.spec?.enforcementAction !== "dryrun"
                    ? "lock"
                    : "lockOpen"
                }
                style={{ fontSize: "10px", textTransform: "uppercase" }}
              >
                mode {item.spec ? item.spec?.enforcementAction ?? "deny" : "?"}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginLeft: "auto" }}>
              <EuiLink href={`/constrainttemplates#${item.kind}`}>
                <EuiText size="xs">
                  <span>TEMPLATE: {item.kind}</span>
                  <EuiIcon type="link" size="s" style={{ marginLeft: 5 }} />
                </EuiText>
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiHorizontalRule margin="none" />
      <EuiSpacer size="s" />
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem grow={false}>
          {item.status?.totalViolations === undefined ? (
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="alert" size="l" color="warning" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <h5>
                    Violations for this Constraint are unknown. This probably
                    means that the Constraint has not been processed by
                    Gatekeeper yet. Please, try refreshing the page.
                  </h5>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : item.status?.totalViolations === 0 ? (
            <EuiFlexGroup alignItems="center" gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiIcon type="check" size="l" color="success" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="s">
                  <h5>There are no violations for this Constraint</h5>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiFlexGroup direction="column" gutterSize="s">
              <EuiFlexItem>
                <EuiAccordion
                  id="violations-1"
                  buttonContent={
                    <EuiFlexGroup
                      gutterSize="s"
                      alignItems="center"
                      responsive={false}
                    >
                      <EuiFlexItem grow={false}>
                        <EuiIcon type="alert" size="m" color="danger" />
                      </EuiFlexItem>

                      <EuiFlexItem>
                        <EuiText size="xs">
                          <h4>Violations</h4>
                        </EuiText>
                      </EuiFlexItem>

                      <EuiFlexItem>
                        <EuiNotificationBadge size="s">
                          {item.status?.totalViolations}
                        </EuiNotificationBadge>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                  paddingSize="none"
                >
                  <EuiFlexGroup direction="column" gutterSize="s">
                    <EuiFlexItem>
                      <EuiBasicTable
                        items={item.status.violations}
                        columns={[
                          {
                            field: "enforcementAction",
                            name: "Action",
                            truncateText: true,
                            width: "8%",
                          },
                          {
                            field: "kind",
                            name: "Kind",
                            truncateText: true,
                            width: "10%",
                          },
                          {
                            field: "namespace",
                            name: "Namespace",
                            truncateText: true,
                            width: "10%",
                          },
                          {
                            field: "name",
                            name: "Name",
                            truncateText: true,
                            width: "15%",
                          },
                          {
                            field: "message",
                            name: "Message",
                            truncateText: false,
                            width: "60%",
                          },
                        ]}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      {(item.status?.totalViolations ?? 0) >
                        item.status.violations.length && (
                        <EuiCallOut
                          title="Not all violations can be shown"
                          color="warning"
                          iconType="alert"
                        >
                          <p>
                            Gatekeeper's configuration is limiting the audit
                            violations per constraint to{" "}
                            {item.status.violations.length}. See Gatekeeper's
                            --constraint-violations-limit audit configuration
                            flag.
                          </p>
                        </EuiCallOut>
                      )}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiAccordion>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiHorizontalRule margin="none" />
      <EuiSpacer size="s" />
      {!item?.spec ? (
        <>
          <EuiFlexGroup alignItems="center" gutterSize="s">
            <EuiFlexItem grow={false}>
              <EuiIcon type="cross" size="l" color="danger" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size="s">
                <h5>This Constraint has no spec defined</h5>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <EuiHorizontalRule margin="none" />
          <EuiSpacer size="s" />
        </>
      ) : (
        <>
          {item?.spec?.match && (
            <>
              <EuiFlexGroup direction="column" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <p style={{ fontWeight: "bold" }}>Match criteria</p>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <JSONTree
                    data={item?.spec?.match}
                    shouldExpandNode={() => true}
                    hideRoot={true}
                    theme={theme}
                    invertTheme={false}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              <EuiHorizontalRule margin="none" />
              <EuiSpacer size="s" />
            </>
          )}
          {item?.spec?.parameters && (
            <>
              <EuiFlexGroup direction="column" gutterSize="s">
                <EuiFlexItem grow={false}>
                  <EuiText size="s">
                    <p style={{ fontWeight: "bold" }}>Parameters</p>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <JSONTree
                    data={item?.spec?.parameters}
                    shouldExpandNode={() => true}
                    hideRoot={true}
                    theme={theme}
                    invertTheme={false}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size="s" />
              <EuiHorizontalRule margin="none" />
              <EuiSpacer size="s" />
            </>
          )}
        </>
      )}
      <EuiFlexGroup direction="column" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="s">
            <p style={{ fontWeight: "bold" }}>
              {`Status at ${item.status.auditTimestamp}`}
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction="row" gutterSize="xs" wrap={true}>
            {item.status.byPod.map((pod) => {
              return (
                <EuiFlexItem
                  grow={false}
                  key={`${item.metadata.name}-${pod.id}`}
                >
                  <EuiBadge
                    iconType={pod.enforced ? "lock" : "lockOpen"}
                    title={`Constraint is ${
                      !pod.enforced ? "NOT " : ""
                    }being ENFORCED by this POD`}
                    style={{
                      paddingRight: 0,
                      borderRight: 0,
                      fontSize: 10,
                      position: "relative",
                    }}
                  >
                    {pod.id}
                    <EuiBadge
                      color="#666"
                      style={{
                        marginLeft: "8px",
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 0,
                        verticalAlign: "baseline",
                      }}
                    >
                      {`GENERATION ${pod.observedGeneration}`}
                    </EuiBadge>
                  </EuiBadge>
                </EuiFlexItem>
              );
            })}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="s" />
      <EuiHorizontalRule margin="none" />
      <EuiSpacer size="s" />
      <EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
        <EuiFlexItem grow={false}>
          <EuiText size="xs" style={{ textTransform: "uppercase" }}>
            created on {item.metadata.creationTimestamp}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}

function ConstraintsComponent() {
  const [sideNav, setSideNav] = useState<ISideNav[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItems] = useState<IConstraint[]>([]);
  const [currentElementInView, setCurrentElementInView] = useState<string>("");
  const [fullyLoadedRefs, setFullyLoadedRefs] = useState<boolean>(false);
  const panelsRef = useRef<HTMLDivElement[]>([]);
  const appContextData = useContext(ApplicationContext);
  const { hash } = useLocation();
  const navigate = useNavigate();

  const onRefChange = useCallback(
    (element: HTMLDivElement | null, index: number) => {
      if (!element) {
        return;
      }

      panelsRef.current[index] = element;

      if (index === items.length - 1) {
        setFullyLoadedRefs(true);
      }
    },
    [panelsRef, items]
  );

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `${appContextData.context.apiUrl}api/v1/constraints/${appContextData.context.currentK8sContext}`
    )
      .then(async (res) => {
        const body: IConstraint[] = await res.json();

        if (!res.ok) {
          throw new Error(JSON.stringify(body));
        }

        setSideNav(generateSideNav(body));
        setItems(body);
      })
      .catch((err) => {
        let error: BackendError;
        try {
          error = JSON.parse(err.message);
        } catch (e) {
          error = {
            description: err.message,
            error: "An error occurred while fetching the constraints",
            action: "Please try again later",
          };
        }
        navigate(`/error`, { state: { error: error, entity: "constraints" } });
      })
      .finally(() => setIsLoading(false));
  }, [appContextData.context.currentK8sContext]);

  useScrollToHash(hash, [fullyLoadedRefs]);

  useCurrentElementInView(panelsRef, setCurrentElementInView);

  useEffect(() => {
    if (currentElementInView) {
      const newItems = sideNav[0].items.map((item) => {
        if (item.name === currentElementInView) {
          item.isSelected = true;
        } else {
          item.isSelected = false;
        }

        return item;
      });
      setSideNav([{ ...sideNav[0], items: newItems }]);
    }
  }, [currentElementInView]);

  return (
    <>
      {isLoading ? (
        <EuiFlexGroup
          justifyContent="center"
          alignItems="center"
          direction="column"
          style={{ height: "86vh" }}
          gutterSize="none"
        >
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <h1>Loading...</h1>
            </EuiTitle>
            <EuiSpacer size="m" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner style={{ width: "75px", height: "75px" }} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <EuiFlexGroup
          style={{ minHeight: "calc(100vh - 100px)" }}
          gutterSize="none"
          direction="column"
        >
          <EuiPage
            paddingSize="none"
            restrictWidth={1100}
            grow={true}
            style={{ position: "relative" }}
            className="gpm-page gpm-page-constraints"
          >
            <EuiPageSideBar
              paddingSize="m"
              style={{
                minWidth: "270px",
              }}
              sticky
            >
              <EuiSideNav items={sideNav} />
              {items.length > 0 && (
                <EuiButton
                  iconSide="right"
                  iconSize="s"
                  iconType="popout"
                  href={`${appContextData.context.apiUrl}api/v1/constraints?report=html`}
                  download
                >
                  <EuiText size="xs">Download violations report</EuiText>
                </EuiButton>
              )}
            </EuiPageSideBar>
            <EuiPageBody>
              <EuiPageContent
                hasBorder={false}
                hasShadow={false}
                color="transparent"
                borderRadius="none"
              >
                <EuiPageContentBody restrictWidth style={{ marginBottom: 350 }}>
                  {items && items.length > 0 ? (
                    items.map((item, index) => {
                      return (
                        <div
                          id={item.metadata.name}
                          key={item.metadata.name}
                          ref={(node) => onRefChange(node, index)}
                        >
                          {SingleConstraint(item)}
                        </div>
                      );
                    })
                  ) : (
                    <EuiEmptyPrompt
                      iconType="alert"
                      body={<p>No Constraint found</p>}
                    />
                  )}
                </EuiPageContentBody>
              </EuiPageContent>
            </EuiPageBody>
          </EuiPage>
        </EuiFlexGroup>
      )}
    </>
  );
}

export default ConstraintsComponent;
